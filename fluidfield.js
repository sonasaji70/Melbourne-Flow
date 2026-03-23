// fluidField.js - Procedural curl-noise flow for jelly motion

function curlNoise(x, y, zoff) {
    let eps = 0.0001;
    let n1 = noise(x, y + eps, zoff);
    let n2 = noise(x, y - eps, zoff);
    let a = (n1 - n2) / (2 * eps);

    n1 = noise(x + eps, y, zoff);
    n2 = noise(x - eps, y, zoff);
    let b = (n1 - n2) / (2 * eps);

    // 2D curl: rotate gradient 90 degrees
    return createVector(a, -b);
}
