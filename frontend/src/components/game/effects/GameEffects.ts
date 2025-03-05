import { Position } from '../../../types';

// Particle for explosion effect
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

// Hit marker effect
interface HitMarker {
  x: number;
  y: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export class GameEffects {
  private particles: Particle[] = [];
  private hitMarkers: HitMarker[] = [];
  private ctx: CanvasRenderingContext2D;
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  // Create an explosion effect at the given position
  createExplosion(position: Position, size: number = 20, particleCount: number = 20): void {
    for (let i = 0; i < particleCount; i++) {
      // Random angle and velocity
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 2;
      
      // Create particle
      this.particles.push({
        x: position.x,
        y: position.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: Math.random() * size / 2 + 2,
        color: this.getExplosionColor(),
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 30 + 20
      });
    }
  }
  
  // Create a hit marker effect at the given position
  createHitMarker(position: Position): void {
    this.hitMarkers.push({
      x: position.x,
      y: position.y,
      size: 20,
      alpha: 1,
      life: 0,
      maxLife: 20
    });
  }
  
  // Update and render all effects
  update(): void {
    this.updateParticles();
    this.updateHitMarkers();
  }
  
  // Update and render particles
  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Apply gravity
      p.vy += 0.1;
      
      // Update life and alpha
      p.life++;
      p.alpha = 1 - (p.life / p.maxLife);
      
      // Remove dead particles
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // Render particle
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Reset global alpha
    this.ctx.globalAlpha = 1;
  }
  
  // Update and render hit markers
  private updateHitMarkers(): void {
    for (let i = this.hitMarkers.length - 1; i >= 0; i--) {
      const h = this.hitMarkers[i];
      
      // Update life and alpha
      h.life++;
      h.alpha = 1 - (h.life / h.maxLife);
      
      // Remove dead hit markers
      if (h.life >= h.maxLife) {
        this.hitMarkers.splice(i, 1);
        continue;
      }
      
      // Render hit marker
      this.ctx.globalAlpha = h.alpha;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      
      // Draw X shape
      const halfSize = h.size / 2;
      this.ctx.beginPath();
      this.ctx.moveTo(h.x - halfSize, h.y - halfSize);
      this.ctx.lineTo(h.x + halfSize, h.y + halfSize);
      this.ctx.moveTo(h.x + halfSize, h.y - halfSize);
      this.ctx.lineTo(h.x - halfSize, h.y + halfSize);
      this.ctx.stroke();
    }
    
    // Reset global alpha
    this.ctx.globalAlpha = 1;
  }
  
  // Get a random color for explosion particles
  private getExplosionColor(): string {
    const colors = [
      '#ff0000', // Red
      '#ff7700', // Orange
      '#ffff00', // Yellow
      '#ffaa00'  // Amber
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
}