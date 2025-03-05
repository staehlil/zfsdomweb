export function randomHex(n,allowNumbers=false) {
    let r= "";
    do {
        r = [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    } while (!allowNumbers && !r.match(/[a-f]/i))
    return r;
}