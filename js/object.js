
function LaguerreObject(Positions, verts) {
    this.verts = verts;
    this.edges = new Array(3);
    this.lists = new Array(3);
    for (var i = 0; i < 3; i++) {
        var i1 = i + 1;
        if (i1 >= 3) i1 -= 3;
        var i2 = i + 2;
        if (i2 >= 3) i2 -= 3;
        this.lists[i] = crsprd_ix(Positions, verts[i1], verts[i2]);
    }
    // Tetrahedral volume factor
    this.vol = triple_prd_ix(Positions, verts[0], verts[1], verts[2]);
    for (var i = 0; i < 3; i++)
        vec_mult_scalar_to(this.lists[i], 50/ this.vol);
    
    // Circumcircle test
    var cdir = zerovec();
    for (var i = 0; i < 3; i++)
        vec_add_to(cdir, this.lists[i]);
    this.cdir = Normalize(cdir);

    var cdsq = 0;
    for (var i = 0; i < 3; i++)
        cdsq += ptdist(this.cdir, Positions[verts[i]]);
    cdsq /= 3;
    this.cdsq = cdsq;
}
// For copying in vertex from another one
LaguerreObject.prototype.copy_vert = function (src) {
    this.verts = src.verts;
    this.lists = src.lists;
    this.vol = src.vol;
    this.cdir = src.cdir;
    this.cdsq = src.cdsq;
}

LaguerreObject.prototype.IsVertOrderRight = function () {
    return this.vol >= 0;
}
LaguerreObject.prototype.IsPointInside = function (p) {
    for (var ic = 0; ic < 3; ic++)
        if (dotprd(p, this.lists[ic]) < 0) return false;

    return true;
}
LaguerreObject.prototype.IsPointInCircumcircle = function (p) {
    return (ptdist(this.cdir, p) < this.cdsq);
}
LaguerreObject.prototype.IsVert = function (ix) {
    for (var ic = 0; ic < 3; ic++)
        if (ix == this.verts[ic]) return true;
    return false;
}
LaguerreObject.prototype.VertIndexIn = function (ix) {
    for (var ic = 0; ic < 3; ic++)
        if (ix == this.verts[ic]) return ic;
    return -1;
}

function EdgeObject(verts) {
    this.verts = verts;
    this.polys = new Array(2);
}

EdgeObject.prototype.IsVert = function (ix) {
    for (var ic = 0; ic < 2; ic++)
        if (ix == this.verts[ic]) return true;
    return false;
}

EdgeObject.prototype.VertIndexIn = function (ix) {
    for (var ic = 0; ic < 2; ic++)
        if (ix == this.verts[ic]) return ic;
    return -1;
}

EdgeObject.prototype.PolyIndexIn = function (pl) {
    for (var ic = 0; ic < 2; ic++)
        if (LaguerreEqual(this.polys[ic], pl)) return ic;
    return -1;
}

function EdgeCheckObject(Positions, verts) {
    this.verts = verts;
    this.pdst = ptdist_ix(Positions, verts[0], verts[1]);
    this.direc = Normalize(crsprd_ix(Positions, verts[0], verts[1]));
    var midpnt = zerovec();
    vec_add_to(midpnt, Positions[verts[0]]);
    vec_add_to(midpnt, Positions[verts[1]]);
    this.midpnt = Normalize(midpnt);
}

EdgeCheckObject.prototype.intersects = function (Positions, other) {
    // About  non-intersecting
    for (var ic = 0; ic < 2; ic++)
        for (var ict = 0; ict < 2; ict++)
            if (this.verts[ic] == other.verts[ict]) return false;

    // Find intersection point; 
    var itsc = Normalize(crsprd(this.direc, other.direc));
    var near0 = dotprd(itsc, this.midpnt) > 0;
    var near1 = dotprd(itsc, other.midpnt) > 0;
    if (near1 != near0) return false;

    var pd0 = [];
    for (var ic = 0; ic < 2; ic++) {
        var pd = ptdist(itsc, Positions[this.verts[ic]]);
        pd0.push(pd);
    }
    var pd1 = [];
    for (var ic = 0; ic < 2; ic++) {
        var pd = ptdist(itsc, Positions[other.verts[ic]]);
        pd1.push(pd);
    }
    var maxpd0 = max(pd0[0], pd0[1]);
    var maxpd1 = max(pd1[0], pd1[1]);
    if ((maxpd0 <= this.pdst) && (maxpd1 <= other.pdst) && near0) return true;

    vec_mult_scalar_to(itsc, -1);
    near0 = !near0;
    for (var ic = 0; ic < 2; ic++) {
        pd0[ic] = -pd0[ic];
        pd1[ic] = -pd1[ic];
    }
    maxpd0 = max(pd0[0], pd0[1]);
    maxpd1 = max(pd1[0], pd1[1]);
    if ((maxpd0 <= this.pdst) && (maxpd1 <= other.pdst) && near0) return true;

    return false;
}

// Adds to an array if it was not already present;
function AddUnique(arr, x) {
    for (var i = 0; i < arr.length; i++)
        if (x == arr[i]) return;
    arr.push(x);
}

// for edges, since testing equality of objects
function AddUniqueEdge(arr, ed) {
    for (var i = 0; i < arr.length; i++)
        if (EdgesEqual(arr[i], ed)) return;
    arr.push(ed);
}
// Find the set intersection
function FindShared(arr1, arr2) {
    var rearr = [];
    for (var i1 = 0; i1 < arr1.length; i1++) {
        var x1 = arr1[i1];
        for (var i2 = 0; i2 < arr2.length; i2++) {
            var x2 = arr2[i2];
            if (x1 == x2) {
                rearr.push(x1);
                break;
            }
        }
    }
    return rearr;
}
//  for edges
function FindSharedEdges(arr1, arr2) {
    var rearr = [];
    for (var i1 = 0; i1 < arr1.length; i1++) {
        var x1 = arr1[i1];
        for (var i2 = 0; i2 < arr2.length; i2++) {
            var x2 = arr2[i2];
            if (EdgesEqual(x1, x2)) {
                rearr.push(x1);
                break;
            }
        }
    }
    return rearr;
}

// Takes all the members of of arr2 out of arr1
// and ignores the arr2 members not present in arr1
function FindSetDiff(arr1, arr2) {
    if (arr2.length == 0) return;
    var diffarr = [];
    for (var i1 = 0; i1 < arr1.length; i1++) {
        var x1 = arr1[i1];
        var AddThisOne = true;
        for (var i2 = 0; i2 < arr2.length; i2++) {
            var x2 = arr2[i2];
            if (x2 == x1) {
                AddThisOne = false;
                break;
            }
        }
        if (AddThisOne) diffarr.push(x1);
    }
    // Clear the array
    arr1.splice(0, arr1.length);
    for (var i = 0; i < diffarr.length; i++)
        arr1.push(diffarr[i]);
}



// for edges
function FindSetDiffEdges(arr1, arr2) {
    if (arr2.length == 0) return;
    var diffarr = [];
    for (var i1 = 0; i1 < arr1.length; i1++) {
        var x1 = arr1[i1];
        var AddThisOne = true;
        for (var i2 = 0; i2 < arr2.length; i2++) {
            var x2 = arr2[i2];
            if (EdgesEqual(x1, x2)) {
                AddThisOne = false;
                break;
            }
        }
        if (AddThisOne) diffarr.push(x1);
    }

    // Clear the array
    arr1.splice(0, arr1.length);

    for (var i = 0; i < diffarr.length; i++)
        arr1.push(diffarr[i]);
}