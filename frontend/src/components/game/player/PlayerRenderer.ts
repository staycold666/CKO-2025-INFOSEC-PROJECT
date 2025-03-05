import { Player, Position } from '../../../types';

export class PlayerRenderer {
  private ctx: CanvasRenderingContext2D;
  private playerRadius: number = 20;
  private playerColors: string[] = [
    '#FF5252', // Red
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#FFC107', // Yellow
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FF9800', // Orange
    '#795548'  // Brown
  ];
  
  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }
  
  // Render a single player
  renderPlayer(player: Player, isCurrentPlayer: boolean = false): void {
    // Draw player body
    this.ctx.fillStyle = player.color;
    this.ctx.beginPath();
    this.ctx.arc(player.position.x, player.position.y, this.playerRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw player direction indicator
    const dirX = player.position.x + Math.cos(player.rotation) * 25;
    const dirY = player.position.y + Math.sin(player.rotation) * 25;
    this.ctx.strokeStyle = isCurrentPlayer ? '#000000' : '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(player.position.x, player.position.y);
    this.ctx.lineTo(dirX, dirY);
    this.ctx.stroke();
    
    // Draw player name
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.username, player.position.x, player.position.y - 30);
    
    // Draw health bar
    this.renderHealthBar(player);
    
    // Add a border for the current player
    if (isCurrentPlayer) {
      this.ctx.strokeStyle = '#ffff00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(player.position.x, player.position.y, this.playerRadius + 3, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    // Draw player status effects
    this.renderStatusEffects(player);
  }
  
  // Render player health bar
  private renderHealthBar(player: Player): void {
    const healthBarWidth = 40;
    const healthPercentage = player.health / 100;
    
    // Background (red)
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(
      player.position.x - healthBarWidth / 2,
      player.position.y - 25,
      healthBarWidth,
      5
    );
    
    // Foreground (green)
    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(
      player.position.x - healthBarWidth / 2,
      player.position.y - 25,
      healthBarWidth * healthPercentage,
      5
    );
    
    // Border
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(
      player.position.x - healthBarWidth / 2,
      player.position.y - 25,
      healthBarWidth,
      5
    );
  }
  
  // Render player status effects (like damage, healing, etc.)
  private renderStatusEffects(player: Player): void {
    // If player is not active (eliminated), draw X
    if (!player.isActive) {
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 4;
      
      const radius = this.playerRadius + 5;
      
      this.ctx.beginPath();
      this.ctx.moveTo(player.position.x - radius, player.position.y - radius);
      this.ctx.lineTo(player.position.x + radius, player.position.y + radius);
      this.ctx.moveTo(player.position.x + radius, player.position.y - radius);
      this.ctx.lineTo(player.position.x - radius, player.position.y + radius);
      this.ctx.stroke();
    }
  }
  
  // Render player hit animation
  renderPlayerHit(position: Position): void {
    // Draw hit circle
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 3;
    
    for (let i = 0; i < 3; i++) {
      const radius = this.playerRadius + i * 5;
      
      this.ctx.globalAlpha = 1 - i * 0.3;
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }
  
  // Get a color for a new player
  getPlayerColor(index: number): string {
    return this.playerColors[index % this.playerColors.length];
  }
}