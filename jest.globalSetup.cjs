// Run every test in the owner's timezone (Japan, UTC+9) so date logic is
// checked where the app is used. Set before Jest starts its workers, which
// inherit it — works on Windows too, unlike a `TZ=` prefix in the script.
module.exports = () => { process.env.TZ = 'Asia/Tokyo'; };
