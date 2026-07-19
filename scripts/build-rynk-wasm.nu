const URL    = 'https://github.com/HaoboGu/rmk.git'
const BRANCH = 'feat/rynk'
const HASH   = 'aa3398ea'

def main [] {
    let work = ($env.TEMP? | default '/tmp') | path join 'rmk-wasm-build'
    rm -rpf $work
    ^git clone --depth 1 --branch $BRANCH $URL $work
    ^wasm-pack build --target web --release $'($work)/rynk/rynk-wasm'
    mkdir src/rynk/wasm
    cp -r $'($work)/rynk/rynk-wasm/pkg/*' src/rynk/wasm/
    rm -rpf $work
}
