function dotprd(x, y) {
    var sum = 0.0;
    for (var ic = 0; ic < 3; ic++)
        sum += x[ic] * y[ic];
    return sum;
}

function crsprd(x, y) {
    var prod = new Array(3);
    for (var ic = 0; ic < 3; ic++) {
        var ic1 = ic + 1;
        if (ic1 >= 3) ic1 -= 3;
        var ic2 = ic + 2;
        if (ic2 >= 3) ic2 -= 3;
        prod[ic] = x[ic1] * y[ic2] - x[ic2] * y[ic1];
    }
    return prod;
}

function triple_prd(x, y, z) {
    return dotprd(crsprd(x, y), z);
}

// This distance formula has some nice properties:
// distance and not square of distance;
// the square roots give better numerical resolution
// distance of antipode(p) to p' = - (distance of p to p')
// Range: -2 to +2

function ptdist(x, y) {
    var dst1 = 0.0;
    var dst2 = 0.0;
    for (var ic = 0; ic < 3; ic++) {
        var diff1 = y[ic] - x[ic];
        dst1 += diff1 * diff1;
        var diff2 = y[ic] + x[ic];
        dst2 += diff2 * diff2
    }
    return Math.sqrt(dst1) - Math.sqrt(dst2);
}

function Normalize(vec) {
    var vecres = new Array(3);
    var sum = 0.0;
    for (var ic = 0; ic < 3; ic++) {
        var val = vec[ic];
        sum += val * val;
    }
    if (sum > 0)
        nrmult = 1 / Math.sqrt(sum);
    else
        nrmult = 0;
    for (var ic = 0; ic < 3; ic++) {
        vecres[ic] = nrmult * vec[ic];
    }
    return vecres;
}

// Indexed versions

function crsprd_ix(Positions, ix, iy) {
    return crsprd(Positions[ix], Positions[iy]);
}

function triple_prd_ix(Positions, ix, iy, iz) {
    return triple_prd(Positions[ix], Positions[iy], Positions[iz]);
}

function ptdist_ix(Positions, ix, iy) {
    return ptdist(Positions[ix], Positions[iy]);
}

// Returns a zero 3-vector
function zerovec() {
    var vec = new Array(3);
    for (var ic = 0; ic < 3; ic++)
        vec[ic] = 0.0;
    return vec;
}

// Implements copying
function vec_copy(x) {
    var vec = new Array(3);
    for (var ic = 0; ic < 3; ic++)
        vec[ic] = x[ic];
    return vec;
}

// Implements x += y
function vec_add_to(x, y) {
    for (var ic = 0; ic < 3; ic++)
        x[ic] += y[ic];
}

// Implements x *= y
function vec_mult_scalar_to(x, y) {
    for (var ic = 0; ic < 3; ic++)
        x[ic] *= y;
}

// Implements x - y
function vec_difference(x, y) {
    var diff = zerovec();
    for (var ic = 0; ic < 3; ic++)
        diff[ic] = x[ic] - y[ic];
    return diff;
}

// JavaScript's counterpart of "null" / "None":
function IsNull(x) {
    return (typeof (x) == 'undefined');
}

function LaguerreEqual(rr1, rr2) {
    if (IsNull(rr1)) return false;
    if (IsNull(rr2)) return false;

    for (var iv = 0; iv < 3; iv++)
        if (rr1.verts[iv] != rr2.verts[iv])
            return false;

    return true;
}

function EdgesEqual(ed1, ed2) {
    if (IsNull(ed1)) return false;
    if (IsNull(ed2)) return false;

    for (var iv = 0; iv < 2; iv++)
        if (ed1.verts[iv] != ed2.verts[iv])
            return false;

    return true;
}

function min(x, y) {
    return (y < x) ? y : x;
}

function max(x, y) {
    return (y > x) ? y : x;
}
