
function AddPointInside(LagueSet, ix) {
    var Positions = LagueSet.positions;
    var p = Positions[ix];
    var Numlagues = LagueSet.Laguerre.length;
    for (var j = 0; j < Numlagues; j++) {
        var lague = LagueSet.Laguerre[j];
        if (lague.IsPointInside(p)) {
            // Create three new Laguerre and their edges
            var eds = lague.edges;
            var laguexs = [];
            for (var i = 0; i < 3; i++)
                laguexs.push(eds[i].PolyIndexIn(lague));
            var newlagues = Array(3);
            var neweds = Array(3);
            for (var i = 0; i < 3; i++) {
                var i1 = i + 1;
                if (i1 >= 3) i1 -= 3;
                newlagues[i] = new LaguerreObject(Positions, [lague.verts[i], lague.verts[i1], ix]);
                neweds[i] = new EdgeObject([lague.verts[i], ix]);
            }
            // Connect those Laguerre and edges
            for (var i = 0; i < 3; i++) {
                var i1 = i + 1;
                if (i1 >= 3) i1 -= 3;
                newlagues[i].edges[0] = neweds[i1];
                newlagues[i].edges[1] = neweds[i];
                neweds[i].polys[0] = newlagues[i];
                neweds[i1].polys[1] = newlagues[i];
            }
            // Find which external edges go with which Laguerre
            for (var ic = 0; ic < 3; ic++) {
                var ed = eds[ic];
                var laguex = laguexs[ic];
                for (var ict = 0; ict < 3; ict++) {
                    var newlague = newlagues[ict];
                    numverts = 0;
                    for (var iv = 0; iv < 2; iv++) {
                        if (newlague.IsVert(ed.verts[iv]))
                            numverts++;
                        if (numverts == 2) {
                            ed.polys[laguex] = newlague;
                            newlague.edges[2] = ed;
                            break;
                        }
                    }
                }
            }

            // Insert those Laguerre and edges into the lists
            LagueSet.Laguerre[j] = newlagues[0];
            for (var ic = 1; ic < 3; ic++)
                LagueSet.Laguerre.push(newlagues[ic]);
            for (var ic = 0; ic < 3; ic++)
                LagueSet.edges.push(neweds[ic]);

            return true;
        }
    }

    return false;
}

function ImproveLaguerre(LagueSet) {
    var Positions = LagueSet.positions;
    var quad_verts = new Array(4);
    for (var itr = 0; itr < 100; itr++) {
        var numflips = 0;
        for (var i = 0; i < LagueSet.edges.length; i++) {
            var edge = LagueSet.edges[i];
            var lagues = edge.polys;

            if (IsNull(lagues[0])) continue;
            if (IsNull(lagues[1])) continue;

            for (var ic = 0; ic < 3; ic++) {
                var ix = lagues[0].verts[ic];
                if (!edge.IsVert(ix)) break;
            }
            var ic1 = ic + 1;
            if (ic1 >= 3) ic1 -= 3;
            var ic2 = ic + 2;
            if (ic2 >= 3) ic2 -= 3;
            quad_verts[0] = ix;
            quad_verts[1] = lagues[0].verts[ic1];
            quad_verts[3] = lagues[0].verts[ic2];

            for (var ic = 0; ic < 3; ic++) {
                var ix = lagues[1].verts[ic];
                if (!edge.IsVert(ix)) break;
            }
            quad_verts[2] = ix;

            // Are the non-edge points in the other Laguerre' circumcircles?
            var incc0 = lagues[0].IsPointInCircumcircle(Positions[quad_verts[2]]);
            var incc1 = lagues[1].IsPointInCircumcircle(Positions[quad_verts[0]]);
            if ((!incc0) && (!incc1)) continue;

            // Are the would-be Laguerre properly oriented?
            var newlague0 = new LaguerreObject(Positions, [quad_verts[0], quad_verts[1], quad_verts[2]]);
            if (!newlague0.IsVertOrderRight()) continue;
            var newlague1 = new LaguerreObject(Positions, [quad_verts[0], quad_verts[2], quad_verts[3]]);
            if (!newlague1.IsVertOrderRight()) continue;

            // If so, then flip
            numflips++;

            // Adjust the edge and lague memberships:
            // 0-3 goes from 0 to 1, 1-2 goes from 1 to 0
            for (var ic = 0; ic < 3; ic++) {
                var ed = lagues[0].edges[ic];
                if (EdgesEqual(ed, edge)) continue;
                else if (ed.IsVert(quad_verts[3])) {
                    var ed03 = ed;
                    var edix03 = ic;
                    break;
                }
            }
            for (var ic = 0; ic < 3; ic++) {
                var ed = lagues[1].edges[ic];
                if (EdgesEqual(ed, edge)) continue;
                else if (ed.IsVert(quad_verts[1])) {
                    var ed12 = ed;
                    var edix12 = ic;
                    break;
                }
            }

            var laguex0 = ed03.PolyIndexIn(lagues[0]);
            var laguex1 = ed12.PolyIndexIn(lagues[1]);

            ed03.polys[laguex0] = lagues[1];
            ed12.polys[laguex1] = lagues[0];
            lagues[0].edges[edix03] = ed12;
            lagues[1].edges[edix12] = ed03;

            // Add the vertices
            lagues[0].copy_vert(newlague0);
            lagues[1].copy_vert(newlague1);
            edge.verts = [quad_verts[0], quad_verts[2]];
        }
        if (numflips == 0) break;
    }
}


function FindConvexHull(LagueSet) {
    var Positions = LagueSet.positions;

    // Find boundary loop -- use as convex hull
    var NextVertex = new Object;
    var VtxStart = -1;
    for (var i = 0; i < LagueSet.edges.length; i++) {
        var edge = LagueSet.edges[i];

        // Find a boundary one -- look for the lague that it contains
        if (IsNull(edge.polys[0])) {
            if (IsNull(edge.polys[1]))
                continue;
            else
                var lague = edge.polys[1];
        } else {
            if (IsNull(edge.polys[1]))
                var lague = edge.polys[0];
            else
                continue;
        }

        // Ensure that the hull is in the same direction as the Laguerre
        var ix0 = edge.verts[0];
        var ix1 = edge.verts[1];
        var posdiff = lague.VertIndexIn(ix1) - lague.VertIndexIn(ix0);
        if (posdiff < 0) posdiff += 3;
        if (posdiff != 1) {
            var ixs = ix0;
            ix0 = ix1;
            ix1 = ixs;
        }

        NextVertex[ix0] = ix1;
        VtxStart = ix0;
    }

    if (VtxStart >= 0) {
        var ix = VtxStart;
        var hull = [ix];
        while (true) {
            var ixnext = NextVertex[ix];
            if (ixnext == VtxStart) break;
            hull.push(ixnext);
            ix = ixnext;
        }

        LagueSet.hull = hull;
    }
}

function FindVoronoiDiagram(LagueSet) {
    // Special cases: 3 or fewer points
    if (LagueSet.Laguerre.length == 1) {
        // when a single laguerre
        if (LagueSet.hull.length == 3) {
            var lague = LagueSet.Laguerre[0];
            LagueSet.vor_positions.push(lague.cdir);
            for (var k = 0; k < 3; k++) {
                var kx = k + 1;
                if (kx >= 3) kx = 0;
                var ky = k - 1;
                if (ky < 0) ky = 2;

                var v1 = LagueSet.positions[LagueSet.hull[k]];
                var v2 = LagueSet.positions[LagueSet.hull[kx]];
                var posdiff = vec_difference(v2, v1);
                LagueSet.vor_positions.push(Normalize(crsprd(posdiff, lague.cdir)));
                LagueSet.vor_edges.push([0, k + 1, 4]);

                var ix = LagueSet.hull[k];
                LagueSet.vor_polys[ix] = new Object;
                var vor_poly = LagueSet.vor_polys[ix];
                var iy = LagueSet.hull[ky];
                for (var l = 0; l < 3; l++) {
                    var edge = LagueSet.edges[l];
                    var shrd = FindShared([iy, ix], edge.verts);
                    if (shrd.length == 2) break;
                }

                vor_poly.edges = [edge];
                vor_poly.Laguerre = [lague];
                vor_poly.boundary = [0, ky + 1, 4, k + 1];
            }
            var ept = vec_copy(lague.cdir);
            vec_mult_scalar_to(ept, -1);
            LagueSet.vor_positions.push(ept);
        }
        return;
    } else if (LagueSet.Laguerre.length == 0) {
        if (LagueSet.hull.length == 2) {
            var v0 = LagueSet.positions[LagueSet.hull[0]];
            var v1 = LagueSet.positions[LagueSet.hull[1]];

            var vt0 = zerovec();
            vec_add_to(vt0, v0);
            vec_add_to(vt0, v1);
            vt0 = Normalize(vt0);
            LagueSet.vor_positions.push(vt0);

            var vt1 = Normalize(crsprd(v0, v1));
            LagueSet.vor_positions.push(vt1);

            var vt2 = vec_copy(vt0);
            vec_mult_scalar_to(vt2, -1);
            LagueSet.vor_positions.push(vt2);

            var vt3 = vec_copy(vt1);
            vec_mult_scalar_to(vt3, -1);
            LagueSet.vor_positions.push(vt3);

            LagueSet.vor_edges.push([0, 1, 2, 3, 0]);

            edge = LagueSet.edges[0];
            for (var k = 0; k < 2; k++) {
                var ix = LagueSet.hull[k];
                LagueSet.vor_polys[ix] = new Object;
                var vor_poly = LagueSet.vor_polys[ix];
                vor_poly.edges = [edge];
                vor_poly.Laguerre = [0];
                if (k == 0)
                    vor_poly.boundary = [0, 1, 2, 3];
                else if (k == 1)
                    vor_poly.boundary = [0, 3, 2, 1];
            }
        }
        return;
    }

    // Create the array of Voronoi-vertex positions:
    for (var i = 0; i < LagueSet.Laguerre.length; i++) {
        var lague = LagueSet.Laguerre[i];
        lague.index = i;
        LagueSet.vor_positions.push(lague.cdir);
    }

    // Voronoi edges parallel original edges
    for (var i = 0; i < LagueSet.edges.length; i++) {
        var edge = LagueSet.edges[i];
        if (!IsNull(edge.polys[0]) && !IsNull(edge.polys[1])) {
            var vor_edge = [edge.polys[0].index, edge.polys[1].index];
            LagueSet.vor_edges.push(vor_edge);
        }
    }

    // Voronoi polygons: -1 at ends means an open one

    //collect and Put them into vor_polys, 
    for (var i = 0; i < LagueSet.indices.length; i++) {
        var ix = LagueSet.indices[i];
        LagueSet.vor_polys[ix] = new Object;

        var vor_poly = LagueSet.vor_polys[ix];
        vor_poly.edges = [];
        vor_poly.Laguerre = [];
        vor_poly.boundary = [];
    }

    for (var i = 0; i < LagueSet.edges.length; i++) {
        var edge = LagueSet.edges[i];
        for (var ic = 0; ic < 2; ic++)
            LagueSet.vor_polys[edge.verts[ic]].edges.push(edge);
    }

    for (var i = 0; i < LagueSet.Laguerre.length; i++) {
        var lague = LagueSet.Laguerre[i];
        for (var ic = 0; ic < 3; ic++)
            LagueSet.vor_polys[lague.verts[ic]].Laguerre.push(lague);
    }

    for (var i = 0; i < LagueSet.indices.length; i++) {
        var ix = LagueSet.indices[i];
        var vor_poly = LagueSet.vor_polys[ix];

        // First lague
        var init_lague = vor_poly.Laguerre[0];
        var lague = init_lague;
        vor_poly.boundary.push(lague.index);

        // First edge
        for (var ic = 0; ic < 3; ic++) {
            var edge = lague.edges[ic];
            if (edge.IsVert(ix))
                break;
        }
        var init_edge = edge;

        // The next lague and edge
        var IsInside = false;
        while (true) {
            var iv = edge.PolyIndexIn(lague);
            lague = edge.polys[1 - iv];
            if (IsNull(lague)) break;
            if (LaguerreEqual(lague, init_lague)) {
                IsInside = true;
                break;
            }

            vor_poly.boundary.push(lague.index);

            for (var ic = 0; ic < 3; ic++) {
                var next_edge = lague.edges[ic];
                if (EdgesEqual(next_edge, edge)) continue;
                if (next_edge.IsVert(ix)) {
                    edge = next_edge;
                    break;
                }
            }
        }

        if (!IsInside) {
            vor_poly.boundary.reverse();
            lague = init_lague;

            // First edge the other way
            for (var ic = 0; ic < 3; ic++) {
                edge = lague.edges[ic];
                if (EdgesEqual(edge, init_edge)) continue;
                if (edge.IsVert(ix))
                    break;
            }

            while (true) {
                var iv = edge.PolyIndexIn(lague);
                lague = edge.polys[1 - iv];
                if (IsNull(lague)) break;

                vor_poly.boundary.push(lague.index);

                for (var ic = 0; ic < 3; ic++) {
                    var next_edge = lague.edges[ic];
                    if (EdgesEqual(next_edge, edge)) continue;
                    if (next_edge.IsVert(ix)) {
                        edge = next_edge;
                        break;
                    }
                }
            }
        }

        // Add -1 on ends for open polygon:
        if (!IsInside) {
            vor_poly.boundary.reverse();
            vor_poly.boundary.push(-1);
            vor_poly.boundary.reverse();
            vor_poly.boundary.push(-1);
        }
    }

    // Handle the area outside of the convex hull
    if (LagueSet.hull.length >= 3) {
        var VorBdLns = new Array();
        var Positions = LagueSet.positions;
        var hlen = LagueSet.hull.length;
        for (var ic = 0; ic < hlen; ic++) {
            var ix = LagueSet.hull[ic];
            var icx = ic + 1;
            if (icx >= hlen) icx = 0;
            var ixa = LagueSet.hull[icx];
            var edset1 = LagueSet.vor_polys[ix].edges;
            var edset2 = LagueSet.vor_polys[ixa].edges;
            var edsetshr = FindSharedEdges(edset1, edset2);
            var edge = edsetshr[0];
            var tvrt = edge.polys[0].index;
            var vt0 = Positions[ix];
            var vt1 = Positions[ixa];
            var vtdf = vec_difference(vt1, vt0);
            // Contains: lague index (Voronoi vertex),
            // great-circle normal
            var VorBdLn = [tvrt, LagueSet.vor_positions[tvrt], ix, vt0, ixa, vt1, vtdf];
            VorBdLns.push(VorBdLn);
        }
        // Find intersections

        while (VorBdLns.length > 3) {
            // Check all combinations of neighbors
            var n = VorBdLns.length;
            var itscpts = new Array();
            var ptitscs = new Array();
            for (var k = 0; k < n; k++)
                ptitscs.push(new Array());
            for (var k = 0; k < n; k++) {
                // Find the intersection point; use the convex hull's direction
                var kx = k + 1;
                if (kx >= n) kx = 0;
                var itscpt = Normalize(crsprd(VorBdLns[k][6], VorBdLns[kx][6]));
                vec_mult_scalar_to(itscpt, -1);
                ptitscs[k].push(itscpts.length)
                ptitscs[kx].push(itscpts.length)
                itscpts.push(itscpt)
            }
            // Find the intersection points that are the closest to their parent points
            for (var k = 0; k < n; k++) {
                var ptitsc = ptitscs[k];
                if (ptitsc.length >= 2) {
                    var dists = new Array();
                    for (var kp = 0; kp < ptitsc.length; kp++)
                        dists.push(ptdist(itscpts[ptitsc[kp]], VorBdLns[k][1]));
                    var dx = 0;
                    var dmin = dists[dx];
                    for (var dxi = 0; dxi < dists.length; dxi++) {
                        var dst = dists[dxi];
                        if (dst < dmin) {
                            dx = dxi;
                            dmin = dst;
                        }
                    }
                    var ptitscrd = ptitsc[dx];
                } else if (ptitsc.length == 1)
                    var ptitscrd = ptitsc[0];
                else
                    var ptitscrd = -1;
                ptitscs[k] = ptitscrd;
            }

            var NewVorBdLns = new Array();
            for (var k = 0; k < n; k++) {
                // Find all matched intersection points and add them
                var kx = k + 1;
                if (kx >= n) kx = 0;
                var ky = k - 1;
                if (ky < 0) ky = n - 1;
                // 0 is lone, 1 is leading, 2 is trailing
                // vorvtidx is the index of the Voronoi vertex
                var pstat = 0
                var ptitsc = ptitscs[k]
                if (ptitsc != -1) {
                    var ptitsc_prev = ptitscs[ky];
                    if (ptitsc == ptitsc_prev)
                        pstat = 2;
                    else {
                        ptitsc_next = ptitscs[kx];
                        if (ptitsc == ptitsc_next)
                            pstat = 1;
                    }
                }

                if (pstat == 0) {
                    // Keep the Voronoi line without merging
                    NewVorBdLns.push(VorBdLns[k]);
                } else if (pstat == 1) {
                    // Merge the Voronoi lines and create a new one
                    var VorBdLn0 = VorBdLns[k];
                    var VorBdLn1 = VorBdLns[kx];
                    var itscpt = itscpts[k];
                    var tvrt0 = VorBdLn0[0];
                    var tvrt1 = VorBdLn1[0];
                    var PointOK = (tvrt1 != tvrt0);
                    if (PointOK) {
                        var nitx = LagueSet.vor_positions.length;
                        var ix0 = VorBdLn0[2];
                        var vt0 = VorBdLn0[3];
                        var ix1 = VorBdLn1[4];
                        var vt1 = VorBdLn1[5];
                        var dst_in = undefined;
                        var dst_out = undefined;
                        for (var m = 0; m < n; m++) {
                            var ptstm = ptdist(VorBdLns[m][3], itscpt);
                            var mrl = m - k;
                            while (mrl < 0) mrl += n;
                            while (mrl >= n) mrl -= n;
                            if (mrl <= 2) {
                                if (dst_in == undefined)
                                    dst_in = ptstm;
                                else if (ptstm < dst_in)
                                    dst_in = ptstm;
                            } else {
                                if (dst_out == undefined)
                                    dst_out = ptstm;
                                else if (ptstm < dst_out)
                                    dst_out = ptstm;
                            }
                        }
                        PointOK = (dst_in < dst_out);
                    }
                    if (PointOK) {
                        var vtdf = vec_difference(vt1, vt0);
                        var VorBdLn = [nitx, itscpt, ix0, vt0, ix1, vt1, vtdf];
                        NewVorBdLns.push(VorBdLn);
                        LagueSet.vor_positions.push(itscpt);
                        var ixi = VorBdLn0[4];
                        // Should be equal:
                        // ixi = VorBdLn2[2];
                        LagueSet.vor_edges.push([tvrt0, nitx]);
                        LagueSet.vor_edges.push([tvrt1, nitx]);
                        // Add the point to the center Voronoi region and close it
                        LagueSet.vor_polys[ixi].boundary.shift();
                        var vpln = LagueSet.vor_polys[ixi].boundary.length;
                        LagueSet.vor_polys[ixi].boundary[vpln - 1] = nitx;
                        // Add the point to the left Voronoi region
                        if (LagueSet.vor_polys[ix0].boundary[1] == tvrt0) {
                            LagueSet.vor_polys[ix0].boundary.unshift(-1);
                            LagueSet.vor_polys[ix0].boundary[1] = nitx;
                        } else {
                            vpln = LagueSet.vor_polys[ix0].boundary.length;
                            if (LagueSet.vor_polys[ix0].boundary[vpln - 2] == tvrt0) {
                                LagueSet.vor_polys[ix0].boundary.push(-1);
                                vpln = LagueSet.vor_polys[ix0].boundary.length;
                                LagueSet.vor_polys[ix0].boundary[vpln - 2] = nitx;
                            }
                        }
                        // Add the point to the right Voronoi region
                        if (LagueSet.vor_polys[ix1].boundary[1] == tvrt1) {
                            LagueSet.vor_polys[ix1].boundary.unshift(-1);
                            LagueSet.vor_polys[ix1].boundary[1] = nitx;
                        } else {
                            vpln = LagueSet.vor_polys[ix1].boundary.length;
                            if (LagueSet.vor_polys[ix1].boundary[vpln - 2] == tvrt1) {
                                LagueSet.vor_polys[ix1].boundary.push(-1);
                                vpln = LagueSet.vor_polys[ix1].boundary.length;
                                LagueSet.vor_polys[ix1].boundary[vpln - 2] = nitx;
                            }
                        }
                    } else {
                        NewVorBdLns.push(VorBdLn0);
                        NewVorBdLns.push(VorBdLn1);
                    }
                } else if (pstat == 2) {
                    // Do nothing
                }
            }

            if (NewVorBdLns.length == VorBdLns.length) break;
            VorBdLns = NewVorBdLns;
        }

        // Special cases: only two or three points left
        if (VorBdLns.length == 2) {
            if (VorBdLns[0][0] != VorBdLns[1][0]) {
                var VorLn = [];
                for (var k = 0; k < 2; k++) {
                    // Connecting line
                    var kx = VorBdLns[k][0];
                    VorLn.push(kx);
                    // Close the Voronoi region by deleting the end -1's
                    kx = VorBdLns[k][2];
                    LagueSet.vor_polys[kx].boundary.shift();
                    LagueSet.vor_polys[kx].boundary.pop();
                }
                LagueSet.vor_edges.push(VorLn);
            }
        } else if (VorBdLns.length == 3) {
            var ic0 = VorBdLns[0][0];
            var ic1 = VorBdLns[1][0];
            var ic2 = VorBdLns[2][0];
            if (ic0 != ic1 && ic0 != ic2 && ic1 != ic2) {
                var nitx = LagueSet.vor_positions.length;
                var v0 = VorBdLns[0][3];
                var v1 = VorBdLns[1][3];
                var v2 = VorBdLns[2][3];
                var itscpt = zerovec();
                vec_add_to(itscpt, crsprd(v0, v1));
                vec_add_to(itscpt, crsprd(v1, v2));
                vec_add_to(itscpt, crsprd(v2, v0));
                itscpt = Normalize(itscpt);
                vec_mult_scalar_to(itscpt, -1);
                LagueSet.vor_positions.push(itscpt);
                for (var k = 0; k < 3; k++) {
                    // Connecting line
                    var VorBdLn = VorBdLns[k];
                    LagueSet.vor_edges.push([VorBdLn[0], nitx]);
                    // Add the point to the Voronoi region and close it
                    var ix = VorBdLn[2];
                    LagueSet.vor_polys[ix].boundary.shift();
                    var vpln = LagueSet.vor_polys[ix].boundary.length;
                    LagueSet.vor_polys[ix].boundary[vpln - 1] = nitx;
                }
            }
        }
    }

    // Adjust the orientations
    for (var k = 0; k < LagueSet.vor_polys.length; k++) {
        vor_poly = LagueSet.vor_polys[k];
        if (vor_poly.boundary.length >= 3 && vor_poly.boundary[0] >= 0) {
            lague = new LaguerreObject(LagueSet.vor_positions, vor_poly.boundary.slice(0, 3));
            if (!lague.IsVertOrderRight())
                vor_poly.boundary.reverse();
        }
    }
}


function FindLaguerreIndexed(Positions, Indices) {
    // Create the lagueSet object
    var LagueSet = new Object;
    LagueSet.positions = Positions;
    LagueSet.indices = Indices;
    LagueSet.Laguerre = [];
    LagueSet.edges = [];
    LagueSet.hull = [];
    LagueSet.vor_positions = [];
    LagueSet.vor_edges = [];
    LagueSet.vor_polys = new Object;

    if (Indices.length < 3) {
        if (Indices.length == 2) {
            LagueSet.edges.push(new EdgeObject(Indices));
            LagueSet.hull = Indices;
        }
        FindVoronoiDiagram(LagueSet);
        return LagueSet;
    }
    var lague = new LaguerreObject(Positions, Indices.slice(0, 3));
    if (!lague.IsVertOrderRight())
        lague = new LaguerreObject(Positions, [Indices[0], Indices[2], Indices[1]]);
    LagueSet.Laguerre.push(lague);
    var echs = new Array(3);

    for (var ic = 0; ic < 3; ic++) {
        var ic1 = ic + 1;
        if (ic1 >= 3) ic1 -= 3;
        var ix = Indices[ic];
        var ix1 = Indices[ic1];
        var vts = [ix, ix1];
        var edge = new EdgeObject(vts);
        var echeck = new EdgeCheckObject(Positions, vts);
        echeck.edge = edge;
        echs[ic] = echeck;
        lague.edges[ic] = edge;
        edge.polys[0] = lague;
        LagueSet.edges.push(edge);
    }

    var BndaryVerts = Indices.slice(0, 3);
    var BoundaryEdges = echs;
    var Verts = Object;
    for (var ic = 0; ic < 3; ic++) {
        var ic1 = ic + 2;
        if (ic1 >= 3) ic1 -= 3;
        var ix = Indices[ic];
        Verts[ix] = [echs[ic], echs[ic + 1]];
    }

    // Add points until it is no longer possible
    for (var i = 3; i < Indices.length; i++) {
        var ix = Indices[i];
        if (AddPointInside(LagueSet, ix)) continue;
        Verts[ix] = [];
        var NewEdges = [];
        var VertsAddedTo = [];
        var EdgesToDelete = [];

        // Find all the non-intersecting edges
        for (var j = 0; j < BndaryVerts.length; j++) {
            var ix1 = BndaryVerts[j];
            var echk = new EdgeCheckObject(Positions, [ix, ix1]);
            var DoesIntersect = false;
            for (var k = 0; k < BoundaryEdges.length; k++) {
                var echk1 = BoundaryEdges[k];
                DoesIntersect = echk.intersects(Positions, echk1);
                if (DoesIntersect) break;
            }
            if (DoesIntersect) continue;

            var edge = new EdgeObject(echk.verts);
            echk.edge = edge;
            AddUniqueEdge(NewEdges, echk);
            AddUniqueEdge(Verts[ix], echk);
            AddUnique(VertsAddedTo, ix);
            AddUniqueEdge(Verts[ix1], echk);
            AddUnique(VertsAddedTo, ix1);
        }

        AddUnique(BndaryVerts, ix);
        // Find all
        for (var j = 0; j < BoundaryEdges.length; j++) {
            var echk = BoundaryEdges[j];
            var echks = [];

            for (var iv = 0; iv < 2; iv++) {
                var vset = FindSharedEdges(Verts[ix], Verts[echk.verts[iv]]);
                if (vset.length == 0) continue;
                echks.push(vset[0]);
            }
            if (echks.length < 2) continue;

            var empt_indx = -1;
            for (var iv = 0; iv < 2; iv++) {
                if (IsNull(echk.edge.polys[iv])) {
                    empt_indx = iv;
                    break;
                }
            }
            if (empt_indx < 0) continue;

            var oldlague = echk.edge.polys[1 - empt_indx];
            var v0 = echk.verts[0];
            var i0 = oldlague.VertIndexIn(v0);
            var v1 = echk.verts[1];
            var i1 = oldlague.VertIndexIn(v1);
            var i01 = i1 - i0;
            if (i01 < 0) i01 += 3;
            if (i01 == 1) {
                // Order in original: other, v0, v1
                var NewlagueVerts = [ix, v1, v0];
            } else if (i01 == 2) {
                // Order in original: other, v1, v0
                var NewlagueVerts = [ix, v0, v1];
            }
            var lague = new LaguerreObject(Positions, NewlagueVerts);
            if (!lague.IsVertOrderRight()) continue;

            // Add the new lague, new edges,
            // or remove them from the lists if necessary
            LagueSet.Laguerre.push(lague);
            echk.edge.polys[empt_indx] = lague;
            lague.edges[0] = echk.edge;
            lague.edges[1] = echks[0].edge;
            lague.edges[2] = echks[1].edge;
            AddUniqueEdge(EdgesToDelete, echk);
            for (var iv = 0; iv < 2; iv++) {
                var echki = echks[iv];
                if (IsNull(echki.edge.polys[0])) {
                    echki.edge.polys[0] = lague;
                    LagueSet.edges.push(echki.edge);
                } else {
                    echki.edge.polys[1] = lague;
                    AddUniqueEdge(EdgesToDelete, echki);
                }
            }
        }

        // Add the new edges and remove the edges and vertices in the interior
        for (var j = 0; j < NewEdges.length; j++)
            AddUniqueEdge(BoundaryEdges, NewEdges[j]);
        FindSetDiffEdges(BoundaryEdges, EdgesToDelete);

        var BndaryVertsToRemove = [];
        for (var j = 0; j < VertsAddedTo.length; j++) {
            var ixa = VertsAddedTo[j];
            FindSetDiffEdges(Verts[ixa], EdgesToDelete);
            if (Verts[ixa].length == 0)
                BndaryVertsToRemove.push(ixa);
        }
        FindSetDiff(BndaryVerts, BndaryVertsToRemove);
    }
    ImproveLaguerre(LagueSet);
    FindConvexHull(LagueSet);
    // Find the regions around each point:
    FindVoronoiDiagram(LagueSet);

    return LagueSet;
}