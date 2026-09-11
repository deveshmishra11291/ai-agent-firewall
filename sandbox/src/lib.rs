#[unsafe(no_mangle)]
pub extern "C" fn _start() {
     
}

#[unsafe(no_mangle)]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[unsafe(no_mangle)]
pub extern "C" fn infinite_loop() {
    loop {
        std::hint::black_box(());
    }
}