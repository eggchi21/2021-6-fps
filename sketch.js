class Vec2 {
    /**
     * @param {number} x ベクトルのx成分
     * @param {number} y ベクトルのy成分
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * @param {Vec2} b 足したいベクトル
     */
    add(b) {
        let a = this;
        return new Vec2(a.x + b.x, a.y + b.y);
    }
    /**
     * @param {Vec2} b 引きたいベクトル
     */
    sub(b) {
        let a = this;
        return new Vec2(a.x - b.x, a.y - b.y);
    }
    /**
     * このベクトルのコピーを返す
     */
    copy() {
        return new Vec2(this.x, this.y);
    }
    /**
     * このベクトルの実数s倍を求める。
     * @param {number} s 何倍するか
     */
    mult(s) {
        return new Vec2(s * this.x, s * this.y);
    }
    /**
     * このベクトルの大きさを求める。
     */
    mag() {
        return sqrt(this.x ** 2 + this.y ** 2);
    }
}

class Ray2 {
    /**
     * @param {Vec2} pos このレイの始点の位置ベクトル.
     * @param {Vec2} way このレイの始点から伸びる方向ベクトル.
     */
    constructor(pos, way) {
        this.pos = pos;
        this.way = way;
    }
    /**
     * 位置ベクトルと方向ベクトルではなく、始点と終点からレイを作る。
     * ※staticについて: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Classes/static
     * @param {Vec2} begin
     * @param {Vec2} end
     */
    static with2p(begin, end) {
        return new Ray2(begin, end.sub(begin));
    }
    /**
     * このレイの始点を求める
     * ※getをつけると、計算時に r.begin() ではなく r.begin と書くだけでよくなる。
     */
    get begin() {
        return this.pos;
    }
    /**
     * このレイの終点を求める
     */
    get end() {
        return this.pos.add(this.way);
    }
    /**
     * このレイと、r2の交点を求める。
     * @param {Ray2} r2
     */
    intersection(r2) {
        let r1 = this;
        // Y軸並行の線分はこのコードでは扱えないので、並行の場合は微妙にずらす
        if (abs(r1.way.x) < 0.01) r1.way.x = 0.01;
        if (abs(r2.way.x) < 0.01) r2.way.x = 0.01;

        // r1,r2を直線として見て、その交点を求める
        let t1 = r1.way.y / r1.way.x;
        let t2 = r2.way.y / r2.way.x;
        let x1 = r1.pos.x;
        let x2 = r2.pos.x;
        let y1 = r1.pos.y;
        let y2 = r2.pos.y;
        let sx = (t1 * x1 - t2 * x2 - y1 + y2) / (t1 - t2);
        let sy = t1 * (sx - x1) + y1;

        // 交点が線分上にないときはnullを返す
        // ※ nullについて: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/null
        if (
            sx > min(r1.begin.x, r1.end.x) &&
            sx < max(r1.begin.x, r1.end.x) &&
            sx > min(r2.begin.x, r2.end.x) &&
            sx < max(r2.begin.x, r2.end.x)
        ) {
            return new Vec2(sx, sy);
        } else {
            return null;
        }
    }
}

class Player {
    constructor() {
        this.pos = new Vec2(0, 0);
        this.angle = 0;
    }
}

/** @type {Player} */
let player;

function setup() {
    createCanvas(640, 360);

    player = new Player();
    player.pos = new Vec2(100, 200);
    player.angle = -PI / 2;
}

function draw() {
    // 背景
    background(60);

    // 壁を描画. Draw the walls
    strokeWeight(3);
    stroke('white');

    // 壁の定義。
    // ※このように書くと、push関数を使わなくてもArrayに変数を入れられる。
    let walls = [
        Ray2.with2p(new Vec2(50, 50), new Vec2(100, 300)),
        Ray2.with2p(new Vec2(100, 300), new Vec2(250, 200)),
        Ray2.with2p(new Vec2(250, 200), new Vec2(50, 50)),
    ];
    for (let wall of walls) {
        line(wall.begin.x, wall.begin.y, wall.end.x, wall.end.y);
    }

    // プレイヤーを描画
    stroke('yellow');
    strokeWeight(20);
    point(player.pos.x, player.pos.y);

    // キー入力
    // ※ a-=b は、a=a-b と同じ。同様に、a+=b は、a=a+b と同じ。
    if (keyIsDown(LEFT_ARROW)) player.angle -= PI / 120;
    if (keyIsDown(RIGHT_ARROW)) player.angle += PI / 120;

    // プレイヤーの視界を描画
    {
        let fov = PI / 2;
        let centerAngle = player.angle;
        let leftAngle = centerAngle - fov / 2;
        let rightAngle = centerAngle + fov / 2;
        let beamTotal = 30;
        let beamIndex = -1;
        for (let angle = leftAngle; angle < rightAngle + 0.01; angle += fov / beamTotal) {
            beamIndex++;
            let beam = new Ray2(
                player.pos.copy(),
                new Vec2(cos(angle), sin(angle)).mult(100)
            );
            stroke('yellow');
            strokeWeight(2);
            line(beam.begin.x, beam.begin.y, beam.end.x, beam.end.y);

            for (let wall of walls) {
                let hitPos = beam.intersection(wall);
                if (hitPos === null) continue;
                stroke('yellow');
                strokeWeight(10);
                point(hitPos.x, hitPos.y);

                // 3Dビューに描画
                let viewRoot = new Vec2(320, 180);
                let wallDist = hitPos.sub(beam.begin).mag();
                let wallPerpDist = wallDist;
                let lineHeight = 2800 / wallPerpDist;
                let lineBegin = viewRoot.add(new Vec2(300 / beamTotal * beamIndex, -lineHeight / 2));
                let lineEnd = lineBegin.add(new Vec2(0, lineHeight));
                stroke('white');
                strokeWeight(4);
                line(lineBegin.x, lineBegin.y, lineEnd.x, lineEnd.y);
            }
        }
    }
}

function touchMoved(event) {
    player.pos.x = event.clientX;
    player.pos.y = event.clientY;
}