let video;
let graphics;
let handposeModel;
let predictions = [];
let circleSize = 40; // 預設圓的大小

function setup() {
    createCanvas(windowWidth, windowHeight); // 全螢幕畫布
    background(0); // 設定背景為黑色

    // 啟用視訊
    video = createCapture(VIDEO);
    video.hide(); // 隱藏原始視訊元素

    // 建立與視窗大小 80% 一樣的 graphics
    graphics = createGraphics(windowWidth * 0.8, windowHeight * 0.8);

    // 載入 Handpose 模型
    handposeModel = ml5.handpose(video, () => {
        console.log("Handpose model loaded!");
    });

    // 當模型偵測到手部時，更新 predictions
    handposeModel.on("predict", results => {
        predictions = results;
    });
}

function draw() {
    background('#a2d2ff'); // 每次重繪時清除背景

    // 將 video 的影像繪製到 graphics 上，並縮放以適應 graphics 的大小
    graphics.push();
    graphics.translate(graphics.width, 0); // 將 graphics 的原點移到右上角
    graphics.scale(-1, 1); // 水平翻轉 graphics
    graphics.image(video, 0, 0, graphics.width, graphics.height);
    graphics.pop();

    graphics.loadPixels(); // 載入 graphics 的像素資料

    // 計算 graphics 的顯示位置，讓它置中
    let x = (width - graphics.width) / 2;
    let y = (height - graphics.height) / 2;

    // 根據手勢更新圓的大小
    let gesture = getGesture();
    if (gesture === "fist") {
        circleSize = 80; // 握拳
    } else if (gesture === "open") {
        circleSize = 40; // 張開五指
    } else if (gesture === "scissors") {
        circleSize = 20; // 剪刀手
    }

    // 遍歷 graphics 的像素資料，分割單位與圓的大小一致
    for (let i = 0; i < graphics.width; i += circleSize) {
        for (let j = 0; j < graphics.height; j += circleSize) {
            // 計算像素索引
            let index = (floor(i) + floor(j) * graphics.width) * 4;

            // 取得 RGB 值
            let r = graphics.pixels[index];
            let g = graphics.pixels[index + 1];
            let b = graphics.pixels[index + 2];

            // 設定圓的顏色為原始顏色
            fill(r, g, b);
            noStroke();

            // 繪製圓圈
            ellipse(x + i + circleSize / 2, y + j + circleSize / 2, circleSize, circleSize);
        }
    }
}

function getGesture() {
    if (predictions.length > 0) {
        const hand = predictions[0];
        const landmarks = hand.landmarks;

        // 計算手指是否伸直
        let extendedFingers = 0;
        for (let i = 1; i <= 4; i++) {
            const tip = landmarks[i * 4]; // 指尖
            const dip = landmarks[i * 4 - 1]; // 第二關節
            if (tip[1] < dip[1]) {
                extendedFingers++;
            }
        }

        // 判斷手勢
        if (extendedFingers === 0) {
            return "fist"; // 握拳
        } else if (extendedFingers === 2) {
            return "scissors"; // 剪刀手
        } else if (extendedFingers === 4) {
            return "open"; // 張開五指
        }
    }
    return "unknown"; // 無法辨識
}

function windowResized() {
    // 當視窗大小改變時，調整畫布大小
    resizeCanvas(windowWidth, windowHeight);

    // 更新 graphics 的大小為視窗的 80%
    graphics = createGraphics(windowWidth * 0.8, windowHeight * 0.8);
}
