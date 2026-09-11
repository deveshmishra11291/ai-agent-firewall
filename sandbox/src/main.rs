use wasmtime::{Config, Engine, Linker, Module, Store};
use wasmtime_wasi::WasiCtxBuilder;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub error: Option<String>,
    pub fuel_used: u64,
    pub execution_time_ms: u64,
    pub output: String,
}

#[derive(Debug, Deserialize)]
struct Policy {
    #[serde(default = "default_decision")]
    decision: String,
    #[serde(default)]
    network: bool,
    #[serde(default)]
    filesystem_read: bool,
    #[serde(default)]
    filesystem_write: bool,
    #[serde(default)]
    process_execution: bool,
    #[serde(default)]
    dynamic_execution: bool,
}

fn default_decision() -> String {
    "ALLOW".to_string()
}

fn execute_wasm(
    module_path: &str,
    func_name: &str,
    fuel_limit: u64,
    policy: &Policy,
) -> ExecutionResult {
    if policy.decision != "ALLOW" {
        return ExecutionResult {
            success: false,
            error: Some("Execution blocked by security policy".to_string()),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        };
    }

    let mut config = Config::new();
    config.consume_fuel(true);

    let engine = match Engine::new(&config) {
        Ok(e) => e,
        Err(e) => return ExecutionResult {
            success: false,
            error: Some(format!("Engine creation failed: {}", e)),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        },
    };

    let wasi = WasiCtxBuilder::new().build_p1();
    let mut store = Store::new(&engine, wasi);

    const INSTANTIATION_FUEL: u64 = 1_000_000;
    if let Err(e) = store.set_fuel(INSTANTIATION_FUEL) {
        return ExecutionResult {
            success: false,
            error: Some(format!("Failed to set fuel: {}", e)),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        };
    }

    let mut linker = Linker::new(&engine);
    if let Err(e) = wasmtime_wasi::p1::add_to_linker_sync(&mut linker, |state| state) {
        return ExecutionResult {
            success: false,
            error: Some(format!("Failed to set up WASI: {}", e)),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        };
    }

    let module = match Module::from_file(&engine, module_path) {
        Ok(m) => m,
        Err(e) => return ExecutionResult {
            success: false,
            error: Some(format!("Failed to load module: {}", e)),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        },
    };

    let instance = match linker.instantiate(&mut store, &module) {
        Ok(i) => i,
        Err(e) => return ExecutionResult {
            success: false,
            error: Some(format!("Failed to instantiate: {}", e)),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        },
    };

    let func = match instance.get_typed_func::<(), ()>(&mut store, func_name) {
        Ok(f) => f,
        Err(_) => match instance.get_typed_func::<(), ()>(&mut store, "_start") {
            Ok(f) => f,
            Err(e) => return ExecutionResult {
                success: false,
                error: Some(format!("Function not found: {}", e)),
                fuel_used: 0,
                execution_time_ms: 0,
                output: String::new(),
            },
        },
    };

    if let Err(e) = store.set_fuel(fuel_limit) {
        return ExecutionResult {
            success: false,
            error: Some(format!("Failed to set fuel: {}", e)),
            fuel_used: 0,
            execution_time_ms: 0,
            output: String::new(),
        };
    }

    let start = std::time::Instant::now();
    let result = func.call(&mut store, ());
    let elapsed = start.elapsed();

    let fuel_used = match store.get_fuel() {
        Ok(remaining) => fuel_limit - remaining,
        Err(_) => fuel_limit,
    };

    match result {
        Ok(()) => ExecutionResult {
            success: true,
            error: None,
            fuel_used,
            execution_time_ms: elapsed.as_millis() as u64,
            output: String::new(),
        },
        Err(e) => {
            let msg = format!("{:#}", e);
            let short = if msg.contains("fuel") {
                "Execution failed: fuel exhausted".to_string()
            } else {
                format!("Execution failed: {}", msg)
            };
            ExecutionResult {
                success: false,
                error: Some(short),
                fuel_used,
                execution_time_ms: elapsed.as_millis() as u64,
                output: String::new(),
            }
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    
    let mut wasm_path = String::new();
    let mut policy_json = String::new();
    
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--wasm" => {
                i += 1;
                wasm_path = args[i].clone();
            }
            "--policy" => {
                i += 1;
                policy_json = args[i].clone();
            }
            _ => {
                eprintln!("Unknown argument: {}", args[i]);
                std::process::exit(1);
            }
        }
        i += 1;
    }
    
    if wasm_path.is_empty() {
        eprintln!("Missing --wasm argument");
        std::process::exit(1);
    }
    
    if policy_json.is_empty() {
        policy_json = "{}".to_string();
    }
    
    let policy: Policy = serde_json::from_str(&policy_json)?;
    
    let result = execute_wasm(&wasm_path, "_start", 100_000_000, &policy);
    
    println!("{}", serde_json::to_string(&result)?);
    
    Ok(())
}