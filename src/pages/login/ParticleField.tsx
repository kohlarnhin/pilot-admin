import React, { useEffect, useRef } from 'react';

const INK = '#0B0F19'; // 接近纯黑，细点也清晰可辨
/** 平均点距（CSS 像素）：每个格子内随机放一个点，分布均匀但没有网格感 */
const GAP = 22;
/** 点的基础直径 */
const DOT_SIZE = 1.9;
/** 鼠标处凸起：影响半径与放大强度 */
const LENS_SIGMA = 70;
const LENS_STRENGTH = 0.2;
/** 登录区外沿的渐隐宽度：点靠近到这段距离内逐渐变淡，到达边缘时消失 */
const FEATHER = 56;
/** 登录区的圆角半径：留白贴合内容形状，四角不空出直角 */
const CLEAR_RADIUS = 48;
/**
 * 向登录区靠拢的流速：速度 = FLOW / 距离（像素/秒）。
 * 与距离成反比的径向流动不会压缩点的间距，整屏疏密始终均匀；远处约 1.5px/s，靠近登录区约 5px/s。
 */
const FLOW = 1500;

interface Dot {
  x: number;
  y: number;
  /** 呼吸相位：以随机为主，各点明灭错开 */
  phase: number;
  /** 漂移的随机种子 */
  seed: number;
}

interface ParticleFieldProps {
  /** 登录内容区域：周围的点缓慢向它靠拢，到达边缘时消失 */
  clearRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * 登录页背景：铺满全屏、随机散布的细点。
 * - 每个点各自轻微漂移，并缓慢向登录区靠拢，越靠近越淡，到达边缘时消失，随后从屏幕外围补入；
 * - 每个点缓慢缩小至几乎消失再显现（呼吸），节奏彼此错开；
 * - 鼠标所在位置向用户凸起：附近的点略微向外散开、放大，颜色与呼吸不变，形成裸眼 3D 的效果；
 * - 系统开启「减少动态效果」时只绘制静态点阵。
 */
export const ParticleField: React.FC<ParticleFieldProps> = ({ clearRef, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let dots: Dot[] = [];
    let frame = 0;
    /** 点的补入半径：以登录区为中心、覆盖整个屏幕的外圆，补入发生在屏幕之外 */
    let spawnRadius = 0;

    // 预渲染的圆点贴图：缩放绘制时边缘柔和，细点也是圆的
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const spriteCtx = sprite.getContext('2d');
    if (spriteCtx) {
      spriteCtx.fillStyle = INK;
      spriteCtx.beginPath();
      spriteCtx.arc(16, 16, 15.5, 0, Math.PI * 2);
      spriteCtx.fill();
    }

    const mouse = { tx: 0, ty: 0, x: 0, y: 0, inside: false, presence: 0 };
    /** 登录区：中心与半宽半高（画布坐标） */
    let clear: { cx: number; cy: number; hw: number; hh: number } | null = null;
    const measureClear = () => {
      const target = clearRef?.current;
      if (!target) {
        clear = null;
        return;
      }
      const box = target.getBoundingClientRect();
      const origin = canvas.getBoundingClientRect();
      clear = {
        cx: box.left - origin.left + box.width / 2,
        cy: box.top - origin.top + box.height / 2,
        hw: box.width / 2,
        hh: box.height / 2,
      };
    };

    /** 到登录区（圆角矩形）边缘的距离：外部为正、内部为负 */
    const distanceToClear = (x: number, y: number) => {
      if (!clear) return Infinity;
      const r = Math.min(CLEAR_RADIUS, clear.hw, clear.hh);
      const qx = Math.abs(x - clear.cx) - (clear.hw - r);
      const qy = Math.abs(y - clear.cy) - (clear.hh - r);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    };

    /** 消失的点从外圆上的随机方向补入（位于屏幕之外，不会凭空闪现） */
    const respawn = (dot: Dot) => {
      const cx = clear?.cx ?? width / 2;
      const cy = clear?.cy ?? height / 2;
      const angle = Math.random() * Math.PI * 2;
      dot.x = cx + Math.cos(angle) * spawnRadius;
      dot.y = cy + Math.sin(angle) * spawnRadius;
    };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      measureClear();
      const cx = clear?.cx ?? width / 2;
      const cy = clear?.cy ?? height / 2;
      spawnRadius = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + GAP * 2;

      dots = [];
      // 抖动采样：每个格子中部随机取一点，分布均匀、没有网格感，也不会扎堆或出现大片空白。
      // 铺满整个外圆（含屏幕外的部分），流入屏幕的点与补入的点衔接，边角不会变稀
      for (let gy = cy - spawnRadius; gy < cy + spawnRadius; gy += GAP) {
        for (let gx = cx - spawnRadius; gx < cx + spawnRadius; gx += GAP) {
          const x = gx + GAP * (0.2 + Math.random() * 0.6);
          const y = gy + GAP * (0.2 + Math.random() * 0.6);
          if (Math.hypot(x - cx, y - cy) > spawnRadius) continue;
          dots.push({ x, y, phase: Math.random() * Math.PI * 2, seed: Math.random() * Math.PI * 2 });
        }
      }
    };

    const draw = (now: number, dt: number) => {
      const t = reduceMotion ? 0 : now / 1000;
      ctx.clearRect(0, 0, width, height);
      // 每帧测量：登录步骤切换导致内容高度变化时，靠拢目标随之更新
      measureClear();

      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 7);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 7);
      mouse.presence += ((mouse.inside ? 1 : 0) - mouse.presence) * Math.min(1, dt * 4);
      const twoSigma2 = 2 * LENS_SIGMA * LENS_SIGMA;

      for (const dot of dots) {
        // 缓慢向登录区中心靠拢；到达边缘后在远处重生
        let fade = 1;
        if (clear) {
          if (!reduceMotion) {
            const dx = clear.cx - dot.x;
            const dy = clear.cy - dot.y;
            const r = Math.max(Math.hypot(dx, dy), 120);
            const speed = FLOW / r;
            dot.x += (dx / r) * speed * dt;
            dot.y += (dy / r) * speed * dt;
          }
          // 越靠近越淡：每个点的消失位置略有随机，边缘自然不成规整的形状
          const d = (distanceToClear(dot.x, dot.y) + Math.sin(dot.seed * 5) * 12) / FEATHER;
          fade = d <= 0 ? 0 : d >= 1 ? 1 : d * d * (3 - 2 * d);
          if (fade <= 0.02) {
            if (!reduceMotion) respawn(dot);
            continue;
          }
        }

        // 各自漂移：方向与节奏随机，整体像悬浮的微尘
        let x = dot.x + Math.sin(t * 0.21 + dot.seed) * 9;
        let y = dot.y + Math.cos(t * 0.17 + dot.seed * 1.3) * 9;

        // 鼠标处凸起：以鼠标为中心的高斯放大，越近越「贴近」用户
        let lift = 0;
        if (mouse.presence > 0.01) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          lift = Math.exp(-(dx * dx + dy * dy) / twoSigma2) * mouse.presence;
          const k = 1 + LENS_STRENGTH * lift;
          x = mouse.x + dx * k;
          y = mouse.y + dy * k;
        }
        if (x < -4 || y < -4 || x > width + 4 || y > height + 4) continue;

        // 呼吸：大部分时间保持饱满清晰，周期里只有一小段缩小、变淡直至消失（鼠标附近同样如此，只是略微放大）
        const breath = reduceMotion ? 1 : 0.5 + 0.5 * Math.sin(t * 0.8 + dot.phase);
        const pulse = 1 - (1 - breath) ** 3;
        const size = DOT_SIZE * (0.2 + 0.8 * pulse) * (0.5 + 0.5 * fade) * (1 + lift * 0.5);
        ctx.globalAlpha = (0.08 + 0.87 * pulse) * fade;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      draw(now, dt);
      frame = requestAnimationFrame(loop);
    };

    const handleMove = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      mouse.tx = event.clientX - box.left;
      mouse.ty = event.clientY - box.top;
      if (!mouse.inside && mouse.presence < 0.05) {
        // 从外部进入时直接定位，避免凸起从上一个位置滑过来
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      mouse.inside = true;
    };
    const handleLeave = () => {
      mouse.inside = false;
    };
    const handleResize = () => {
      build();
      if (reduceMotion) draw(0, 0);
    };

    build();
    if (reduceMotion) {
      draw(0, 0);
    } else {
      frame = requestAnimationFrame(loop);
      window.addEventListener('pointermove', handleMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', handleLeave);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handleMove);
      document.documentElement.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [clearRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
};
