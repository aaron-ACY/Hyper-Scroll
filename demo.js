// --- CONFIGURATION ---
const CONFIG = {
    itemCount: 30,
    starCount: 150,
    zGap: 800,
    loopSize: 0,
    camSpeed: 2.5,
    colors: ['#ff003c', '#00f3ff', '#ccff00', '#ffffff']
};
CONFIG.loopSize = CONFIG.itemCount * CONFIG.zGap;

// --- DATA ---
const HIGHLIGHT_TEXTS = [
    "WELCOME!", "FEEL", "TREE", "TO", "LOOK", "AROUND",
    "VALORANT", "MAIN", "CHAMBER", "OPERATOR"
];

const AGENTS = [
    "Jett", "Phoenix", "Sage", "Sova", "Raze", "Reyna",
    "Killjoy", "Breach", "Cypher", "Omen", "Viper", "Chamber"
];

// --- STATE ---
const state = {
    scroll: 0,
    velocity: 0,
    targetSpeed: 0,
    mouseX: 0,
    mouseY: 0
};

const world = document.getElementById('world');
const viewport = document.getElementById('viewport');
const items = [];

// --- INIT ---
function init() {
    let highlightIndex = 0;
    let agentIndex = 0;

    for (let i = 0; i < CONFIG.itemCount; i++) {
        const el = document.createElement('div');
        el.className = 'item';

        if (i % 2 === 0 && highlightIndex < HIGHLIGHT_TEXTS.length) {
            // Big red text
            const txt = document.createElement('div');
            txt.className = 'big-text';
            txt.style.color = '#ff003c';
            txt.innerText = HIGHLIGHT_TEXTS[highlightIndex++];
            el.appendChild(txt);

            items.push({
                el, type: 'text',
                x: 0, y: 0, rot: 0,
                baseZ: -i * CONFIG.zGap
            });
        } else {
            // Agent card
            const card = document.createElement('div');
            card.className = 'card';
            const agentName = AGENTS[agentIndex++ % AGENTS.length];

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-id">${agentName}</span>
                    <div style="width: 10px; height: 10px; background: var(--accent);"></div>
                </div>
                <h2>${agentName}</h2>
                <div class="card-footer">
                    <span>GRID: ${Math.floor(Math.random() * 10)}x${Math.floor(Math.random() * 10)}</span>
                    <span>DATA_SIZE: ${(Math.random() * 100).toFixed(1)}MB</span>
                </div>
                <div style="position:absolute; bottom:2rem; right:2rem; font-size:4rem; opacity:0.1; font-weight:900;">0${i}</div>
            `;
            el.appendChild(card);

            const angle = (i / CONFIG.itemCount) * Math.PI * 6;
            const x = Math.cos(angle) * (window.innerWidth * 0.3);
            const y = Math.sin(angle) * (window.innerHeight * 0.3);
            const rot = (Math.random() - 0.5) * 30;

            items.push({
                el, type: 'card',
                x, y, rot,
                baseZ: -i * CONFIG.zGap
            });
        }

        world.appendChild(el);
    }

    // Stars
    for (let i = 0; i < CONFIG.starCount; i++) {
        const el = document.createElement('div');
        el.className = 'star';
        world.appendChild(el);
        items.push({
            el, type: 'star',
            x: (Math.random() - 0.5) * 3000,
            y: (Math.random() - 0.5) * 3000,
            baseZ: -Math.random() * CONFIG.loopSize
        });
    }

    // Mouse move
    window.addEventListener('mousemove', (e) => {
        state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });
}
init();

// --- LENIS ---
const lenis = new Lenis({
    smooth: true,
    lerp: 0.08,
    direction: 'vertical',
    gestureDirection: 'vertical',
    smoothTouch: true
});
lenis.on('scroll', ({ scroll, velocity }) => {
    state.scroll = scroll;
    state.targetSpeed = velocity;
});

// --- RAF LOOP ---
let lastTime = 0;
function raf(time) {
    lenis.raf(time);
    const delta = time - lastTime;
    lastTime = time;

    state.velocity += (state.targetSpeed - state.velocity) * 0.1;

    const tiltX = state.mouseY * 5 - state.velocity * 0.5;
    const tiltY = state.mouseX * 5;
    world.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;

    viewport.style.perspective = `${1000 - Math.min(Math.abs(state.velocity) * 10, 600)}px`;

    const cameraZ = state.scroll * CONFIG.camSpeed;

    items.forEach(item => {
        let relZ = item.baseZ + cameraZ;
        const modC = CONFIG.loopSize;
        let vizZ = ((relZ % modC) + modC) % modC;
        if (vizZ > 500) vizZ -= modC;

        let alpha = 1;
        if (vizZ < -3000) alpha = 0;
        else if (vizZ < -2000) alpha = (vizZ + 3000) / 1000;
        if (vizZ > 100 && item.type !== 'star') alpha = 1 - ((vizZ - 100) / 400);
        if (alpha < 0) alpha = 0;
        item.el.style.opacity = alpha;

        if (alpha > 0) {
            let trans = `translate3d(${item.x}px, ${item.y}px, ${vizZ}px)`;
            if (item.type === 'star') {
                trans += ` scale3d(1,1,${Math.max(1, Math.min(1 + Math.abs(state.velocity) * 0.1, 10))})`;
            } else if (item.type === 'text') {
                trans += ` rotateZ(${item.rot}deg)`;
                if (Math.abs(state.velocity) > 1) {
                    const offset = state.velocity * 2;
                    item.el.style.textShadow = `${offset}px 0 red, ${-offset}px 0 cyan`;
                } else item.el.style.textShadow = 'none';
            } else {
                const t = time * 0.001;
                const float = Math.sin(t + item.x) * 10;
                trans += ` rotateZ(${item.rot}deg) rotateY(${float}deg)`;
            }
            item.el.style.transform = trans;
        }
    });

    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
