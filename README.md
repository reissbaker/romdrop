```
  _______    ______   __       __        _______   _______    ______   _______
 /       \  /      \ /  \     /  |      /       \ /       \  /      \ /       \
 $$$$$$$  |/$$$$$$  |$$  \   /$$ |      $$$$$$$  |$$$$$$$  |/$$$$$$  |$$$$$$$  |
 $$ |__$$ |$$ |  $$ |$$$  \ /$$$ |      $$ |  $$ |$$ |__$$ |$$ |  $$ |$$ |__$$ |
 $$    $$< $$ |  $$ |$$$$  /$$$$ |      $$ |  $$ |$$    $$< $$ |  $$ |$$    $$/
 $$$$$$$  |$$ |  $$ |$$ $$ $$/$$ |      $$ |  $$ |$$$$$$$  |$$ |  $$ |$$$$$$$/
 $$ |  $$ |$$ \__$$ |$$ |$$$/ $$ |      $$ |__$$ |$$ |  $$ |$$ \__$$ |$$ |
 $$ |  $$ |$$    $$/ $$ | $/  $$ |      $$    $$/ $$ |  $$ |$$    $$/ $$ |
 $$/   $$/  $$$$$$/  $$/      $$/       $$$$$$$/  $$/   $$/  $$$$$$/  $$/
```

A fast, light webserver you can run directly on your Raspberry Pi running
RetroPie, to make ROM uploads easy. Go to `<hostname>.lan:<port>` and drop ROMs
onto your Pi.

# Dependencies
[Rust](https://rustup.rs/) and [Rollup](https://rollupjs.org/).

# Building

```
cargo build --release
cd assets/javascript
rollup --config
```

# Running

```
./target/release/romdrop <PORT>
```
