import type { Character } from '../../人物管理/类型/人物类型';
import {
  ALL_UNIT_CHARACTERS,
  getRandomUnitCharacter,
  getRandomUnitCharacterByRace,
  getUnitByName,
  getUnitsByRace,
} from '../类型/单位数据表';
import type { BattleUnit } from '../类型/战斗属性';
import { NewBattleSystem } from './新战斗系统';

/**
 * 战斗工厂类
 * 用于创建战斗实例和管理单位
 */
export class BattleFactory {
  /**
   * 根据单位人物名称创建战斗单位
   */
  public static createBattleUnit(unitName: string, level: number = 1): BattleUnit | null {
    const unitCharacter = getUnitByName(unitName);
    if (!unitCharacter) return null;

    // 根据等级调整属性
    const levelMultiplier = 1 + (level - 1) * 0.2;

    return {
      id: unitCharacter.name, // 使用名称作为ID
      name: unitCharacter.name,
      type: (unitCharacter.unitType as any) || 'physical',
      level: unitCharacter.level,
      attributes: {
        attack: Math.floor(unitCharacter.attributes.attack * levelMultiplier),
        defense: Math.floor(unitCharacter.attributes.defense * levelMultiplier),
        intelligence: Math.floor(unitCharacter.attributes.intelligence * levelMultiplier),
        speed: Math.floor(unitCharacter.attributes.speed * levelMultiplier),
      },
      maxHealth: Math.floor(unitCharacter.attributes.health * levelMultiplier),
      currentHealth: Math.floor(unitCharacter.attributes.health * levelMultiplier),
      isAlive: true,
    };
  }

  /**
   * 从人物数据创建战斗单位
   */
  public static createBattleUnitFromCharacter(character: any): BattleUnit | null {
    if (!character || !character.attributes) return null;

    return {
      id: character.name, // 使用名称作为ID
      name: character.name,
      type: character.unitType || 'physical',
      level: Math.floor(character.offspring / 10),
      attributes: {
        attack: character.attributes.attack || 0,
        defense: character.attributes.defense || 0,
        intelligence: character.attributes.intelligence || 0,
        speed: character.attributes.speed || 0,
      },
      maxHealth: character.attributes.health || Math.floor(character.offspring / 10) * 10,
      currentHealth: character.attributes.health || Math.floor(character.offspring / 10) * 10,
      isAlive: true,
      avatar: character.avatar, // 添加avatar字段
      fallbackAvatar: character.avatar && !character.avatar.startsWith('http') ? character.avatar : undefined, // 保存emoji作为回退
    };
  }

  /**
   * 从敌方人物数据创建战斗单位
   */
  public static createBattleUnitFromEnemyCharacter(enemyCharacter: Character): BattleUnit | null {
    if (!enemyCharacter || enemyCharacter.status !== 'enemy' || !enemyCharacter.canCombat) return null;

    return {
      id: enemyCharacter.name, // 使用名称作为ID
      name: enemyCharacter.name,
      type: enemyCharacter.unitType || 'physical',
      level: enemyCharacter.level,
      attributes: {
        attack: enemyCharacter.attributes.attack,
        defense: enemyCharacter.attributes.defense,
        intelligence: enemyCharacter.attributes.intelligence,
        speed: enemyCharacter.attributes.speed,
      },
      maxHealth: enemyCharacter.attributes.health,
      currentHealth: enemyCharacter.attributes.health,
      isAlive: true,
      avatar: enemyCharacter.avatar, // 添加avatar字段
      fallbackAvatar:
        enemyCharacter.avatar && !enemyCharacter.avatar.startsWith('http') ? enemyCharacter.avatar : undefined, // 保存emoji作为回退
    };
  }

  /**
   * 创建随机敌方单位
   */
  public static createRandomEnemy(level: number = 1): BattleUnit | null {
    const randomUnit = ALL_UNIT_CHARACTERS[Math.floor(Math.random() * ALL_UNIT_CHARACTERS.length)];
    return this.createBattleUnit(randomUnit.name, level);
  }

  /**
   * 创建随机敌方角色战斗单位
   */
  public static createRandomEnemyCharacter(): BattleUnit | null {
    const randomCharacter = getRandomUnitCharacter();
    return this.createBattleUnitFromEnemyCharacter(randomCharacter);
  }

  /**
   * 根据等级创建随机敌方角色战斗单位
   */
  public static createRandomEnemyCharacterByLevel(level: number): BattleUnit | null {
    // 根据等级筛选单位人物
    const charactersByLevel = ALL_UNIT_CHARACTERS.filter(char => char.level === level);
    if (charactersByLevel.length === 0) {
      // 如果没有对应等级的人物，返回随机人物
      const randomCharacter = getRandomUnitCharacter();
      return this.createBattleUnitFromEnemyCharacter(randomCharacter);
    }
    const randomCharacter = charactersByLevel[Math.floor(Math.random() * charactersByLevel.length)];
    return this.createBattleUnitFromEnemyCharacter(randomCharacter);
  }

  /**
   * 根据种族创建随机敌方角色战斗单位
   */
  public static createRandomEnemyCharacterByRace(race: string): BattleUnit | null {
    const randomCharacter = getRandomUnitCharacterByRace(race);
    return this.createBattleUnitFromEnemyCharacter(randomCharacter);
  }

  /**
   * 根据稀有度创建敌方单位
   */
  public static createEnemyByRarity(rarity: string, level: number = 1): BattleUnit | null {
    const units = ALL_UNIT_CHARACTERS.filter(unit => unit.rating === rarity);
    if (units.length === 0) return null;

    const randomUnit = units[Math.floor(Math.random() * units.length)];
    return this.createBattleUnit(randomUnit.name, level);
  }

  /**
   * 创建哥布林部队（受等级限制）
   */
  public static createGoblinArmy(composition: {
    grunts?: number;
    warriors?: number;
    shamans?: number;
    paladins?: number;
  }): BattleUnit[] {
    const army: BattleUnit[] = [];

    // 创建各种哥布林单位
    if (composition.grunts) {
      for (let i = 0; i < composition.grunts; i++) {
        const unit = this.createBattleUnit('哥布林');
        if (unit) army.push(unit);
      }
    }

    if (composition.warriors) {
      for (let i = 0; i < composition.warriors; i++) {
        const unit = this.createBattleUnit('哥布林战士');
        if (unit) army.push(unit);
      }
    }

    if (composition.shamans) {
      for (let i = 0; i < composition.shamans; i++) {
        const unit = this.createBattleUnit('哥布林萨满');
        if (unit) army.push(unit);
      }
    }

    if (composition.paladins) {
      for (let i = 0; i < composition.paladins; i++) {
        const unit = this.createBattleUnit('哥布林圣骑士');
        if (unit) army.push(unit);
      }
    }

    return army;
  }

  /**
   * 根据玩家等级限制创建哥布林部队
   * 等级越高，可以指挥的单位数量越多
   */
  public static createGoblinArmyWithLevelLimit(
    playerLevel: number,
    composition: {
      grunts?: number;
      warriors?: number;
      shamans?: number;
      paladins?: number;
    },
  ): { army: BattleUnit[]; isValid: boolean; maxUnits: number; currentUnits: number } {
    // 计算等级限制
    const maxUnits = this.calculateMaxUnitsByLevel(playerLevel);
    const currentUnits =
      (composition.grunts || 0) +
      (composition.warriors || 0) +
      (composition.shamans || 0) +
      (composition.paladins || 0);

    // 如果超出限制，按比例缩减
    let actualComposition = { ...composition };
    if (currentUnits > maxUnits) {
      const scaleFactor = maxUnits / currentUnits;
      actualComposition = {
        grunts: Math.floor((composition.grunts || 0) * scaleFactor),
        warriors: Math.floor((composition.warriors || 0) * scaleFactor),
        shamans: Math.floor((composition.shamans || 0) * scaleFactor),
        paladins: Math.floor((composition.paladins || 0) * scaleFactor),
      };
    }

    const army = this.createGoblinArmy(actualComposition);
    const finalUnitCount = army.length;

    return {
      army,
      isValid: finalUnitCount <= maxUnits,
      maxUnits,
      currentUnits: finalUnitCount,
    };
  }

  /**
   * 根据等级计算最大可指挥单位数
   */
  private static calculateMaxUnitsByLevel(level: number): number {
    // 基础公式：等级 * 2 + 5
    // 等级1: 7个单位, 等级5: 15个单位, 等级10: 25个单位
    return Math.max(5, level * 2 + 5);
  }

  /**
   * 创建人类守卫部队
   */
  public static createHumanGuard(guardCount: number, level: number = 1): BattleUnit[] {
    const guards: BattleUnit[] = [];

    for (let i = 0; i < guardCount; i++) {
      const unit = this.createBattleUnit('人类守卫', level);
      if (unit) guards.push(unit);
    }

    return guards;
  }

  /**
   * 创建混合敌方部队（敌人不受等级限制）
   */
  public static createMixedEnemyArmy(composition: {
    guards?: number;
    soldiers?: number;
    archers?: number;
    mages?: number;
    priests?: number;
    knights?: number;
  }): BattleUnit[] {
    const army: BattleUnit[] = [];

    if (composition.guards) {
      for (let i = 0; i < composition.guards; i++) {
        const unit = this.createBattleUnit('人类守卫');
        if (unit) army.push(unit);
      }
    }

    if (composition.soldiers) {
      for (let i = 0; i < composition.soldiers; i++) {
        const unit = this.createBattleUnit('人类士兵');
        if (unit) army.push(unit);
      }
    }

    if (composition.archers) {
      for (let i = 0; i < composition.archers; i++) {
        const unit = this.createBattleUnit('人类弓箭手');
        if (unit) army.push(unit);
      }
    }

    if (composition.mages) {
      for (let i = 0; i < composition.mages; i++) {
        const unit = this.createBattleUnit('人类法师');
        if (unit) army.push(unit);
      }
    }

    if (composition.priests) {
      for (let i = 0; i < composition.priests; i++) {
        const unit = this.createBattleUnit('人类牧师');
        if (unit) army.push(unit);
      }
    }

    if (composition.knights) {
      for (let i = 0; i < composition.knights; i++) {
        const unit = this.createBattleUnit('人类骑士');
        if (unit) army.push(unit);
      }
    }

    return army;
  }

  /**
   * 创建AI据点防守部队（不受等级限制，可自由配置）
   */
  public static createAIDefenseArmy(composition: {
    guards?: number;
    soldiers?: number;
    archers?: number;
    mages?: number;
    priests?: number;
    knights?: number;
    // 可以添加更多敌方单位类型
    elves?: number;
    undead?: number;
    demons?: number;
    angels?: number;
  }): BattleUnit[] {
    const army: BattleUnit[] = [];

    // 人类单位
    if (composition.guards) {
      for (let i = 0; i < composition.guards; i++) {
        const unit = this.createBattleUnit('人类守卫');
        if (unit) army.push(unit);
      }
    }

    if (composition.soldiers) {
      for (let i = 0; i < composition.soldiers; i++) {
        const unit = this.createBattleUnit('人类士兵');
        if (unit) army.push(unit);
      }
    }

    if (composition.archers) {
      for (let i = 0; i < composition.archers; i++) {
        const unit = this.createBattleUnit('人类弓箭手');
        if (unit) army.push(unit);
      }
    }

    if (composition.mages) {
      for (let i = 0; i < composition.mages; i++) {
        const unit = this.createBattleUnit('人类法师');
        if (unit) army.push(unit);
      }
    }

    if (composition.priests) {
      for (let i = 0; i < composition.priests; i++) {
        const unit = this.createBattleUnit('人类牧师');
        if (unit) army.push(unit);
      }
    }

    if (composition.knights) {
      for (let i = 0; i < composition.knights; i++) {
        const unit = this.createBattleUnit('人类骑士');
        if (unit) army.push(unit);
      }
    }

    // 其他种族单位

    if (composition.elves) {
      for (let i = 0; i < composition.elves; i++) {
        const unit = this.createBattleUnit('永恒精灵游侠');
        if (unit) army.push(unit);
      }
    }

    if (composition.undead) {
      for (let i = 0; i < composition.undead; i++) {
        const unit = this.createBattleUnit('骷髅战士');
        if (unit) army.push(unit);
      }
    }

    if (composition.demons) {
      for (let i = 0; i < composition.demons; i++) {
        const unit = this.createBattleUnit('恶魔战士');
        if (unit) army.push(unit);
      }
    }

    if (composition.angels) {
      for (let i = 0; i < composition.angels; i++) {
        const unit = this.createBattleUnit('守护天使');
        if (unit) army.push(unit);
      }
    }

    return army;
  }

  /**
   * 创建敌方人物部队（使用统一的人物系统）
   */
  public static createEnemyCharacterArmy(composition: {
    human?: number;
    elf?: number;
    undead?: number;
    angel?: number;
    demon?: number;
  }): BattleUnit[] {
    const army: BattleUnit[] = [];

    // 人类角色
    if (composition.human) {
      const humanCharacters = getUnitsByRace('人类');
      for (let i = 0; i < composition.human; i++) {
        const randomCharacter = humanCharacters[Math.floor(Math.random() * humanCharacters.length)];
        const unit = this.createBattleUnitFromEnemyCharacter(randomCharacter);
        if (unit) army.push(unit);
      }
    }

    // 精灵角色
    if (composition.elf) {
      const elfCharacters = getUnitsByRace('永恒精灵');
      for (let i = 0; i < composition.elf; i++) {
        const randomCharacter = elfCharacters[Math.floor(Math.random() * elfCharacters.length)];
        const unit = this.createBattleUnitFromEnemyCharacter(randomCharacter);
        if (unit) army.push(unit);
      }
    }

    // 亡灵角色
    if (composition.undead) {
      const undeadCharacters = getUnitsByRace('亡灵');
      for (let i = 0; i < composition.undead; i++) {
        const randomCharacter = undeadCharacters[Math.floor(Math.random() * undeadCharacters.length)];
        const unit = this.createBattleUnitFromEnemyCharacter(randomCharacter);
        if (unit) army.push(unit);
      }
    }

    // 天使角色
    if (composition.angel) {
      const angelCharacters = getUnitsByRace('天使');
      for (let i = 0; i < composition.angel; i++) {
        const randomCharacter = angelCharacters[Math.floor(Math.random() * angelCharacters.length)];
        const unit = this.createBattleUnitFromEnemyCharacter(randomCharacter);
        if (unit) army.push(unit);
      }
    }

    // 魔族角色
    if (composition.demon) {
      const demonCharacters = getUnitsByRace('魔族');
      for (let i = 0; i < composition.demon; i++) {
        const randomCharacter = demonCharacters[Math.floor(Math.random() * demonCharacters.length)];
        const unit = this.createBattleUnitFromEnemyCharacter(randomCharacter);
        if (unit) army.push(unit);
      }
    }

    return army;
  }

  /**
   * 根据据点类型创建敌方人物部队
   */
  public static createEnemyCharacterArmyByLocation(
    locationType: 'village' | 'town' | 'fortress' | 'ruins' | 'dungeon' | 'city',
  ): BattleUnit[] {
    let composition: any = {};

    switch (locationType) {
      case 'village':
        composition = { human: 2 };
        break;
      case 'town':
        composition = { human: 3 };
        break;
      case 'city':
        composition = { human: 4 };
        break;
      case 'fortress':
        composition = { human: 3 };
        break;
      case 'ruins':
        composition = { undead: 2 };
        break;
      case 'dungeon':
        composition = { undead: 2 }; // 暂时只有亡灵，可以后续扩展
        break;
    }

    return this.createEnemyCharacterArmy(composition);
  }

  /**
   * 创建敌方单位带领的部队（单位 + 同种族单位）
   */
  public static createEnemyUnitCaptainArmy(captainUnitName: string, unitCount: number = 2): BattleUnit[] {
    const army: BattleUnit[] = [];

    // 首先添加队长单位
    const captainUnit = this.createBattleUnit(captainUnitName);
    if (!captainUnit) return army;

    army.push(captainUnit);

    // 获取队长单位可以带领的种族
    const captainCharacter = getUnitByName(captainUnitName);
    if (!captainCharacter?.canLeadRaces) return army;

    const canLeadRace = captainCharacter.canLeadRaces[0]; // 获取可以带领的种族

    // 根据种族获取可用的单位人物
    const availableCharacters = getUnitsByRace(canLeadRace);
    if (availableCharacters.length === 0) return army;

    // 添加指定数量的同种族单位
    for (let i = 0; i < unitCount; i++) {
      const randomCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
      const unit = this.createBattleUnit(randomCharacter.name);
      if (unit) army.push(unit);
    }

    return army;
  }

  /**
   * 创建战斗实例
   */
  public static createBattle(allies: BattleUnit[], enemies: BattleUnit[]): NewBattleSystem {
    return new NewBattleSystem(allies, enemies);
  }

  /**
   * 从部队编制创建战斗部队
   */
  public static createBattleArmyFromFormation(captains: any[]): BattleUnit[] {
    const army: BattleUnit[] = [];

    captains.forEach(captain => {
      if (captain?.troops) {
        Object.entries(captain.troops).forEach(([type, count]) => {
          const countNum = count as number;
          for (let i = 0; i < countNum; i++) {
            // 根据类型映射到正确的单位名称
            const unitName = this.getGoblinUnitNameByType(type);
            const unit = this.createBattleUnit(unitName);
            if (unit) army.push(unit);
          }
        });
      }
    });

    return army;
  }

  /**
   * 计算部队编制总战力
   */
  public static calculateFormationPower(captains: any[]): number {
    let totalPower = 0;

    // 队长战力
    captains.forEach(captain => {
      if (captain) {
        totalPower +=
          captain.attributes.attack +
          captain.attributes.defense +
          captain.attributes.intelligence +
          captain.attributes.speed;
      }
    });

    // 部队战力
    captains.forEach(captain => {
      if (captain?.troops) {
        Object.entries(captain.troops).forEach(([type, count]) => {
          const countNum = count as number;
          for (let i = 0; i < countNum; i++) {
            const unitName = this.getGoblinUnitNameByType(type);
            const unit = this.createBattleUnit(unitName);
            if (unit) {
              totalPower +=
                unit.attributes.attack + unit.attributes.defense + unit.attributes.intelligence + unit.attributes.speed;
            }
          }
        });
      }
    });

    return totalPower;
  }

  /**
   * 创建标准哥布林巢穴战斗
   */
  public static createGoblinNestBattle(goblinArmy: BattleUnit[], enemyCount: number = 3): NewBattleSystem {
    const enemies: BattleUnit[] = [];

    // 创建敌方单位
    for (let i = 0; i < enemyCount; i++) {
      const enemy = this.createRandomEnemy();
      if (enemy) enemies.push(enemy);
    }

    return new NewBattleSystem(goblinArmy, enemies);
  }

  /**
   * 创建据点攻击战斗
   */
  public static createLocationAttackBattle(
    goblinArmy: BattleUnit[],
    locationType: 'village' | 'town' | 'fortress' | 'ruins' | 'dungeon' | 'city',
  ): NewBattleSystem {
    let enemyCount = 2;
    let enemyLevel = 1;

    // 根据据点类型调整敌方强度
    switch (locationType) {
      case 'village':
        enemyCount = 2;
        enemyLevel = 1;
        break;
      case 'town':
        enemyCount = 3;
        enemyLevel = 2;
        break;
      case 'city':
        enemyCount = 5;
        enemyLevel = 3;
        break;
      case 'fortress':
        enemyCount = 4;
        enemyLevel = 3;
        break;
      case 'ruins':
        enemyCount = 2;
        enemyLevel = 2;
        break;
      case 'dungeon':
        enemyCount = 3;
        enemyLevel = 2;
        break;
    }

    const enemies: BattleUnit[] = [];
    for (let i = 0; i < enemyCount; i++) {
      const enemy = this.createRandomEnemy(enemyLevel);
      if (enemy) enemies.push(enemy);
    }

    return new NewBattleSystem(goblinArmy, enemies);
  }

  /**
   * 获取单位属性描述
   */
  public static getUnitDescription(unit: BattleUnit): string {
    const { attack, defense, intelligence, speed } = unit.attributes;
    return `${unit.name} (等级:${unit.level} 攻:${attack} 防:${defense} 知:${intelligence} 速:${speed})`;
  }

  /**
   * 获取部队总战力
   */
  public static getArmyPower(army: BattleUnit[]): number {
    return army.reduce((total, unit) => {
      return total + unit.attributes.attack + unit.attributes.intelligence;
    }, 0);
  }

  /**
   * 获取部队平均速度
   */
  public static getArmyAverageSpeed(army: BattleUnit[]): number {
    if (army.length === 0) return 0;
    const totalSpeed = army.reduce((total, unit) => total + unit.attributes.speed, 0);
    return Math.floor(totalSpeed / army.length);
  }

  /**
   * 获取等级统计信息
   */
  public static getLevelStatistics(army: BattleUnit[]): {
    totalUnits: number;
    averageLevel: number;
    maxLevel: number;
    minLevel: number;
  } {
    if (army.length === 0) {
      return { totalUnits: 0, averageLevel: 0, maxLevel: 0, minLevel: 0 };
    }

    const levels = army.map(unit => unit.level || 1);
    const totalLevel = levels.reduce((sum, level) => sum + level, 0);

    return {
      totalUnits: army.length,
      averageLevel: Math.floor((totalLevel / army.length) * 100) / 100,
      maxLevel: Math.max(...levels),
      minLevel: Math.min(...levels),
    };
  }

  /**
   * 根据哥布林类型获取单位名称
   */
  private static getGoblinUnitNameByType(type: string): string {
    const typeMapping: { [key: string]: string } = {
      grunt: '普通哥布林',
      warrior: '哥布林战士',
      shaman: '哥布林萨满',
      paladin: '哥布林圣骑士',
    };
    return typeMapping[type] || '普通哥布林';
  }
}
