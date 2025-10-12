import type { BattleAction, BattleResult, BattleState, BattleTurn, BattleUnit } from '../类型/战斗属性';
import { ActionType } from '../类型/战斗属性';

/**
 * 新战斗系统
 * 基于攻防知速四个属性的回合制战斗系统
 */
export class NewBattleSystem {
  private battleState: BattleState;
  private battleHistory: BattleTurn[] = [];
  private actionQueue: BattleUnit[] = [];
  private currentActionIndex: number = 0;

  constructor(allies: BattleUnit[], enemies: BattleUnit[]) {
    this.battleState = {
      allies: allies.map(unit => ({ ...unit, currentHealth: unit.maxHealth, isAlive: true })),
      enemies: enemies.map(unit => ({ ...unit, currentHealth: unit.maxHealth, isAlive: true })),
      currentTurn: 1,
      isFinished: false,
    };

    // 生成行动序列：按速度排序
    this.generateActionQueue();
  }

  /**
   * 生成行动队列
   */
  private generateActionQueue(): void {
    const allUnits = [...this.battleState.allies, ...this.battleState.enemies];
    // 按速度从高到低排序
    this.actionQueue = allUnits.sort((a, b) => b.attributes.speed - a.attributes.speed);
    this.currentActionIndex = 0;
  }

  /**
   * 执行完整战斗
   */
  public executeBattle(): BattleResult {
    while (!this.battleState.isFinished) {
      this.executeTurn();
    }

    return this.generateBattleResult();
  }

  /**
   * 执行单个回合
   */
  public executeSingleTurn(): BattleTurn | null {
    if (this.battleState.isFinished) return null;

    const turnActions: BattleAction[] = [];
    const startState = this.cloneBattleState();

    // 获取所有存活单位并按速度排序
    const allUnits = [...this.battleState.allies, ...this.battleState.enemies]
      .filter(unit => unit.isAlive)
      .sort((a, b) => b.attributes.speed - a.attributes.speed);

    // 每个单位执行行动
    for (const unit of allUnits) {
      if (!unit.isAlive || this.battleState.isFinished) break;

      const action = this.executeUnitAction(unit);
      if (action) {
        turnActions.push(action);
      }

      // 检查战斗是否结束
      this.checkBattleEnd();
    }

    // 记录回合
    const turn: BattleTurn = {
      turnNumber: this.battleState.currentTurn,
      actions: turnActions,
      startState,
      endState: this.cloneBattleState(),
    };

    this.battleHistory.push(turn);
    this.battleState.currentTurn++;

    return turn;
  }

  /**
   * 执行单个行动（支持集火目标）
   */
  public executeSingleAction(focusTarget?: BattleUnit): any {
    if (this.battleState.isFinished) return null;

    // 找到下一个应该行动的单位（跳过已死亡的单位）
    let nextUnit: BattleUnit | null = null;
    while (this.currentActionIndex < this.actionQueue.length) {
      const unit = this.actionQueue[this.currentActionIndex];
      if (unit.isAlive) {
        nextUnit = unit;
        break;
      }
      this.currentActionIndex++;
    }

    // 如果没有找到存活单位，重新生成行动队列
    if (!nextUnit) {
      this.generateActionQueue();
      if (this.actionQueue.length === 0) return null;
      nextUnit = this.actionQueue[0];
    }

    // 执行单位行动
    const action = this.executeUnitAction(nextUnit, focusTarget);
    if (action) {
      // 移动到下一个单位
      this.currentActionIndex++;

      // 如果到达队列末尾，重新开始
      if (this.currentActionIndex >= this.actionQueue.length) {
        this.currentActionIndex = 0;
      }

      return {
        ...action,
        endState: this.cloneBattleState(),
      };
    }

    return null;
  }

  /**
   * 执行一个回合
   */
  private executeTurn(): void {
    const turnActions: BattleAction[] = [];
    const startState = this.cloneBattleState();

    // 获取所有存活单位并按速度排序
    const allUnits = [...this.battleState.allies, ...this.battleState.enemies]
      .filter(unit => unit.isAlive)
      .sort((a, b) => b.attributes.speed - a.attributes.speed);

    // 每个单位执行行动
    for (const unit of allUnits) {
      if (!unit.isAlive || this.battleState.isFinished) break;

      const action = this.executeUnitAction(unit);
      if (action) {
        turnActions.push(action);
      }

      // 检查战斗是否结束
      this.checkBattleEnd();
    }

    // 记录回合
    const turn: BattleTurn = {
      turnNumber: this.battleState.currentTurn,
      actions: turnActions,
      startState,
      endState: this.cloneBattleState(),
    };

    this.battleHistory.push(turn);
    this.battleState.currentTurn++;
  }

  /**
   * 执行单位行动
   */
  private executeUnitAction(unit: BattleUnit, focusTarget?: BattleUnit): BattleAction | null {
    // 选择目标：只有我方单位才会使用集火目标
    let target: BattleUnit | null = null;

    const isAlly = this.battleState.allies.includes(unit);

    if (isAlly && focusTarget) {
      // 只有我方单位才使用集火目标
      // 通过ID匹配而不是对象引用匹配
      const targetIsEnemy = this.battleState.enemies.some(enemy => enemy.id === focusTarget.id);
      if (targetIsEnemy) {
        // 使用战斗系统中的敌方单位对象
        target = this.battleState.enemies.find(enemy => enemy.id === focusTarget.id) || null;
        console.log('集火攻击目标:', target?.name, '是否存活:', target?.isAlive);

        // 如果集火目标已死亡，清除集火状态
        if (target && !target.isAlive) {
          console.log('集火目标已死亡，使用AI选择');
          target = null;
        }
      } else {
        console.log('集火目标不是敌方单位，使用AI选择');
      }
    }

    // 如果没有集火目标或集火目标不可攻击，使用AI选择目标
    if (!target) {
      target = this.selectTarget(unit);
      console.log('AI选择目标:', target?.name);
    }

    if (!target) return null;

    const actionType = this.selectActionType(unit);
    return this.executeAction(unit, target, actionType);
  }

  /**
   * 选择目标
   */
  private selectTarget(unit: BattleUnit): BattleUnit | null {
    const isAlly = this.battleState.allies.includes(unit);
    const enemies = isAlly ? this.battleState.enemies : this.battleState.allies;
    const aliveEnemies = enemies.filter(enemy => enemy.isAlive);

    if (aliveEnemies.length === 0) return null;

    // 选择血量最低的敌人
    return aliveEnemies.reduce((lowest, current) => (current.currentHealth < lowest.currentHealth ? current : lowest));
  }

  /**
   * 选择行动类型
   */
  private selectActionType(unit: BattleUnit): ActionType {
    // 根据单位类型选择行动
    if (unit.type === 'magical' || unit.attributes.intelligence > unit.attributes.attack) {
      return ActionType.MAGICAL_ATTACK;
    } else {
      return ActionType.PHYSICAL_ATTACK;
    }
  }

  /**
   * 执行行动
   */
  private executeAction(actor: BattleUnit, target: BattleUnit, actionType: ActionType): BattleAction {
    let damage = 0;
    let hit = false;
    let critical = false;

    switch (actionType) {
      case ActionType.PHYSICAL_ATTACK:
        ({ damage, hit, critical } = this.calculatePhysicalDamage(actor, target));
        break;
      case ActionType.MAGICAL_ATTACK:
        ({ damage, hit, critical } = this.calculateMagicalDamage(actor, target));
        break;
      case ActionType.DEFEND:
        this.applyDefendStatus(actor);
        return {
          type: actionType,
          actor,
          description: `${actor.name} 进入防御姿态`,
        };
    }

    if (hit) {
      this.applyDamage(target, damage);
    }

    return {
      type: actionType,
      actor,
      target,
      damage: hit ? damage : 0,
      hit,
      critical,
      description: this.generateActionDescription(actor, target, actionType, damage, hit, critical),
    };
  }

  /**
   * 计算物理伤害
   */
  private calculatePhysicalDamage(
    attacker: BattleUnit,
    defender: BattleUnit,
  ): { damage: number; hit: boolean; critical: boolean } {
    const baseAttack = attacker.attributes.attack;
    const baseDefense = defender.attributes.defense;

    // 命中率计算（基础90%，受速度影响）
    const hitChance = 0.9 + (attacker.attributes.speed - defender.attributes.speed) * 0.01;
    const hit = Math.random() < Math.max(0.1, Math.min(0.95, hitChance));

    if (!hit) {
      return { damage: 0, hit: false, critical: false };
    }

    // 暴击率计算（基础5%，受智力影响）
    const critChance = 0.05 + attacker.attributes.intelligence * 0.002;
    const critical = Math.random() < critChance;

    // 伤害计算
    const baseDamage = baseAttack - baseDefense;
    const damageMultiplier = critical ? 2.0 : 1.0;
    const finalDamage = Math.max(1, Math.floor(baseDamage * damageMultiplier));

    return { damage: finalDamage, hit: true, critical };
  }

  /**
   * 计算法术伤害
   */
  private calculateMagicalDamage(
    attacker: BattleUnit,
    defender: BattleUnit,
  ): { damage: number; hit: boolean; critical: boolean } {
    const baseIntelligence = attacker.attributes.intelligence;
    const baseDefense = defender.attributes.defense;

    // 法术命中率（基础85%，受智力影响）
    const hitChance = 0.85 + attacker.attributes.intelligence * 0.005;
    const hit = Math.random() < Math.max(0.15, Math.min(0.95, hitChance));

    if (!hit) {
      return { damage: 0, hit: false, critical: false };
    }

    // 法术暴击率（基础8%，受智力影响）
    const critChance = 0.08 + attacker.attributes.intelligence * 0.003;
    const critical = Math.random() < critChance;

    // 法术伤害计算（防御力影响较小）
    const baseDamage = baseIntelligence - Math.floor(baseDefense * 0.5);
    const damageMultiplier = critical ? 2.5 : 1.0;
    const finalDamage = Math.max(1, Math.floor(baseDamage * damageMultiplier));

    return { damage: finalDamage, hit: true, critical };
  }

  /**
   * 应用伤害
   */
  private applyDamage(target: BattleUnit, damage: number): void {
    const previousHealth = target.currentHealth;
    target.currentHealth = Math.max(0, target.currentHealth - damage);

    // 处理哥布林损失（仅对我方单位）
    if (target.troops && this.isAllyUnit(target)) {
      this.handleGoblinLoss(target, previousHealth, target.currentHealth);
    }

    if (target.currentHealth === 0) {
      target.isAlive = false;
    }
  }

  /**
   * 处理哥布林损失 - 普通哥布林优先承担伤害（肉盾机制）
   */
  private handleGoblinLoss(unit: BattleUnit, previousHealth: number, currentHealth: number): void {
    if (!unit.troops) return;

    const healthLoss = previousHealth - currentHealth;
    if (healthLoss <= 0) return;

    // 计算哥布林提供的血量加成
    const goblinHealthBonus = this.calculateGoblinHealthBonus(unit);
    if (goblinHealthBonus <= 0) return;

    // 计算损失比例（基于哥布林提供的血量）
    const lossRatio = healthLoss / goblinHealthBonus;
    const clampedLossRatio = Math.min(lossRatio, 1); // 限制最大损失比例为100%

    // 优先损失普通哥布林（肉盾机制）
    let remainingLossRatio = clampedLossRatio;

    // 1. 优先损失普通哥布林（承担更多伤害）
    if (unit.troops.normalGoblins && unit.troops.normalGoblins > 0) {
      // 普通哥布林承担1.5倍的损失比例
      const normalLossRatio = Math.min(remainingLossRatio * 1.5, 1);
      const normalLoss = Math.floor(unit.troops.normalGoblins * normalLossRatio);
      unit.troops.normalGoblins = Math.max(0, unit.troops.normalGoblins - normalLoss);

      // 如果普通哥布林全部损失，剩余损失由其他哥布林承担
      if (unit.troops.normalGoblins === 0) {
        remainingLossRatio = Math.max(0, remainingLossRatio - normalLossRatio);
      } else {
        remainingLossRatio = Math.max(0, remainingLossRatio - normalLossRatio / 1.5);
      }
    }

    // 2. 如果还有剩余损失，按比例损失其他哥布林
    if (remainingLossRatio > 0) {
      if (unit.troops.warriorGoblins && unit.troops.warriorGoblins > 0) {
        const warriorLoss = Math.floor(unit.troops.warriorGoblins * remainingLossRatio);
        unit.troops.warriorGoblins = Math.max(0, unit.troops.warriorGoblins - warriorLoss);
      }

      if (unit.troops.shamanGoblins && unit.troops.shamanGoblins > 0) {
        const shamanLoss = Math.floor(unit.troops.shamanGoblins * remainingLossRatio);
        unit.troops.shamanGoblins = Math.max(0, unit.troops.shamanGoblins - shamanLoss);
      }

      if (unit.troops.paladinGoblins && unit.troops.paladinGoblins > 0) {
        const paladinLoss = Math.floor(unit.troops.paladinGoblins * remainingLossRatio);
        unit.troops.paladinGoblins = Math.max(0, unit.troops.paladinGoblins - paladinLoss);
      }
    }

    console.log(
      `单位 ${unit.name} 哥布林损失（肉盾机制），普通哥布林优先承担伤害，损失比例: ${(clampedLossRatio * 100).toFixed(1)}%，剩余血量: ${currentHealth}/${unit.maxHealth}`,
    );
  }

  /**
   * 计算哥布林提供的血量加成
   */
  private calculateGoblinHealthBonus(unit: BattleUnit): number {
    if (!unit.troops) return 0;

    let totalBonus = 0;

    // 计算各种哥布林提供的血量加成
    if (unit.troops.normalGoblins && unit.troops.normalGoblins > 0) {
      // 普通哥布林按0.5等级计算，血量加成较少
      totalBonus += unit.troops.normalGoblins * 2; // 假设每个普通哥布林提供2点血量
    }

    if (unit.troops.warriorGoblins && unit.troops.warriorGoblins > 0) {
      // 战士哥布林按1等级计算
      totalBonus += unit.troops.warriorGoblins * 5; // 假设每个战士哥布林提供5点血量
    }

    if (unit.troops.shamanGoblins && unit.troops.shamanGoblins > 0) {
      // 萨满哥布林按1等级计算
      totalBonus += unit.troops.shamanGoblins * 4; // 假设每个萨满哥布林提供4点血量
    }

    if (unit.troops.paladinGoblins && unit.troops.paladinGoblins > 0) {
      // 圣骑士哥布林按1等级计算
      totalBonus += unit.troops.paladinGoblins * 8; // 假设每个圣骑士哥布林提供8点血量
    }

    return totalBonus;
  }

  /**
   * 判断是否为我方单位
   */
  private isAllyUnit(unit: BattleUnit): boolean {
    return this.battleState.allies.some(ally => ally.id === unit.id);
  }

  /**
   * 应用防御状态
   */
  private applyDefendStatus(_unit: BattleUnit): void {
    // 防御状态暂时简化，只记录防御行为
    // 后续可以扩展为临时属性加成
  }

  /**
   * 检查战斗是否结束
   */
  private checkBattleEnd(): void {
    const aliveAllies = this.battleState.allies.filter(unit => unit.isAlive);
    const aliveEnemies = this.battleState.enemies.filter(unit => unit.isAlive);

    if (aliveAllies.length === 0) {
      this.battleState.isFinished = true;
      this.battleState.winner = 'enemies';
    } else if (aliveEnemies.length === 0) {
      this.battleState.isFinished = true;
      this.battleState.winner = 'allies';
    }
  }

  /**
   * 生成行动描述
   */
  private generateActionDescription(
    actor: BattleUnit,
    target: BattleUnit,
    actionType: ActionType,
    damage: number,
    hit: boolean,
    critical: boolean,
  ): string {
    if (!hit) {
      return `${actor.name} 攻击 ${target.name}，但被躲开了！`;
    }

    let description = '';
    if (actionType === ActionType.PHYSICAL_ATTACK) {
      description = `${actor.name} 对 ${target.name} 进行物理攻击`;
    } else if (actionType === ActionType.MAGICAL_ATTACK) {
      description = `${actor.name} 对 ${target.name} 施展法术`;
    }

    if (critical) {
      description += `，造成暴击伤害 ${damage} 点！`;
    } else {
      description += `，造成 ${damage} 点伤害。`;
    }

    if (!target.isAlive) {
      description += ` ${target.name} 被击败了！`;
    }

    return description;
  }

  /**
   * 生成战斗结果
   */
  private generateBattleResult(): BattleResult {
    const totalDamageDealt = this.calculateTotalDamageDealt();
    const totalDamageReceived = this.calculateTotalDamageReceived();
    const criticalHits = this.countCriticalHits();
    const misses = this.countMisses();

    return {
      victory: this.battleState.winner === 'allies',
      totalTurns: this.battleState.currentTurn - 1,
      turns: this.battleHistory,
      finalState: this.battleState,
      statistics: {
        totalDamageDealt,
        totalDamageReceived,
        criticalHits,
        misses,
      },
    };
  }

  /**
   * 计算总伤害输出
   */
  private calculateTotalDamageDealt(): number {
    return this.battleHistory.reduce((total, turn) => {
      return (
        total +
        turn.actions.reduce((turnTotal, action) => {
          return turnTotal + (action.damage || 0);
        }, 0)
      );
    }, 0);
  }

  /**
   * 计算总伤害承受
   */
  private calculateTotalDamageReceived(): number {
    // 这里需要根据实际伤害记录来计算
    // 简化实现
    return this.calculateTotalDamageDealt();
  }

  /**
   * 计算暴击次数
   */
  private countCriticalHits(): number {
    return this.battleHistory.reduce((total, turn) => {
      return total + turn.actions.filter(action => action.critical).length;
    }, 0);
  }

  /**
   * 计算未命中次数
   */
  private countMisses(): number {
    return this.battleHistory.reduce((total, turn) => {
      return total + turn.actions.filter(action => !action.hit).length;
    }, 0);
  }

  /**
   * 克隆战斗状态
   */
  private cloneBattleState(): BattleState {
    return JSON.parse(JSON.stringify(this.battleState));
  }

  /**
   * 获取当前战斗状态
   */
  public getCurrentState(): BattleState {
    return this.battleState;
  }

  /**
   * 获取战斗历史
   */
  public getBattleHistory(): BattleTurn[] {
    return this.battleHistory;
  }
}
