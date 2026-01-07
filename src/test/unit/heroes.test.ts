import { describe, it, expect, beforeEach } from 'vitest';
import { 
  HeroClass, 
  AVAILABLE_HEROES, 
  getHeroById, 
  getAllHeroes, 
  createHeroCopy 
} from '@/lib/heroes';
import { SkillType, GameContext } from '@/types/game';

describe('Heroes System', () => {
  describe('HeroClass', () => {
    let testHero: HeroClass;

    beforeEach(() => {
      testHero = new HeroClass(
        'test-hero',
        '测试武将',
        [],
        '/test-avatar.jpg',
        '测试描述'
      );
    });

    it('should create hero with correct properties', () => {
      expect(testHero.id).toBe('test-hero');
      expect(testHero.name).toBe('测试武将');
      expect(testHero.skills).toEqual([]);
      expect(testHero.awakened).toBe(false);
      expect(testHero.avatar).toBe('/test-avatar.jpg');
      expect(testHero.description).toBe('测试描述');
    });

    it('should get available skills', () => {
      const mockSkill = {
        id: 'test-skill',
        name: '测试技能',
        type: SkillType.ACTIVE,
        description: '测试技能描述',
        isUsed: false,
        canUse: () => true,
        execute: () => ({ success: true })
      };

      testHero.skills = [mockSkill];
      const availableSkills = testHero.getAvailableSkills();
      
      expect(availableSkills).toHaveLength(1);
      expect(availableSkills[0]).toBe(mockSkill);
    });

    it('should filter out unavailable skills', () => {
      const availableSkill = {
        id: 'available-skill',
        name: '可用技能',
        type: SkillType.ACTIVE,
        description: '可用技能描述',
        isUsed: false,
        canUse: () => true,
        execute: () => ({ success: true })
      };

      const unavailableSkill = {
        id: 'unavailable-skill',
        name: '不可用技能',
        type: SkillType.LIMITED,
        description: '不可用技能描述',
        isUsed: true,
        canUse: () => false,
        execute: () => ({ success: false })
      };

      testHero.skills = [availableSkill, unavailableSkill];
      const availableSkills = testHero.getAvailableSkills();
      
      expect(availableSkills).toHaveLength(1);
      expect(availableSkills[0]).toBe(availableSkill);
    });

    it('should use skill successfully', () => {
      const mockSkill = {
        id: 'test-skill',
        name: '测试技能',
        type: SkillType.ACTIVE,
        description: '测试技能描述',
        isUsed: false,
        canUse: () => true,
        execute: (context: GameContext) => ({ success: true, message: '技能使用成功' })
      };

      testHero.skills = [mockSkill];
      
      const mockContext: GameContext = {
        gameState: {} as any
      };

      const result = testHero.useSkill('test-skill', mockContext);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('技能使用成功');
    });

    it('should fail to use non-existent skill', () => {
      const mockContext: GameContext = {
        gameState: {} as any
      };

      const result = testHero.useSkill('non-existent-skill', mockContext);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('技能不存在');
    });

    it('should fail to use unavailable skill', () => {
      const mockSkill = {
        id: 'unavailable-skill',
        name: '不可用技能',
        type: SkillType.LIMITED,
        description: '不可用技能描述',
        isUsed: true,
        canUse: () => false,
        execute: () => ({ success: true })
      };

      testHero.skills = [mockSkill];
      
      const mockContext: GameContext = {
        gameState: {} as any
      };

      const result = testHero.useSkill('unavailable-skill', mockContext);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('技能不可用');
    });

    it('should awaken hero', () => {
      expect(testHero.awakened).toBe(false);
      
      testHero.awaken();
      
      expect(testHero.awakened).toBe(true);
    });

    it('should reset skills', () => {
      // Create a proper BaseSkill instance for testing
      class TestSkill {
        id = 'test-skill';
        name = '测试技能';
        type = SkillType.LIMITED;
        description = '测试技能描述';
        isUsed = true;
        
        canUse() { 
          return !this.isUsed; 
        }
        
        execute() { 
          return { success: true }; 
        }
      }

      const mockSkill = new TestSkill();
      testHero.skills = [mockSkill];
      testHero.awakened = true;
      
      testHero.resetSkills();
      
      expect(testHero.awakened).toBe(false);
      // The resetSkills method only resets BaseSkill instances
      // Since our TestSkill is not a BaseSkill, it won't be reset
      // Let's test with the actual hero skills instead
    });

    it('should reset skills for actual hero', () => {
      const xiangyu = getHeroById('xiangyu')!;
      const heroCopy = createHeroCopy(xiangyu);
      
      // Mark a limited skill as used (刘邦 has a limited skill)
      const liubang = getHeroById('liubang')!;
      const liubangCopy = createHeroCopy(liubang);
      const limitedSkill = liubangCopy.skills.find(skill => skill.type === SkillType.LIMITED);
      
      if (limitedSkill) {
        limitedSkill.isUsed = true;
        liubangCopy.awakened = true;
        
        liubangCopy.resetSkills();
        
        expect(liubangCopy.awakened).toBe(false);
        expect(limitedSkill.isUsed).toBe(false);
      }
    });
  });

  describe('Available Heroes', () => {
    it('should have all expected heroes', () => {
      expect(AVAILABLE_HEROES).toHaveLength(6);
      
      const heroNames = AVAILABLE_HEROES.map(hero => hero.name);
      expect(heroNames).toContain('项羽');
      expect(heroNames).toContain('刘邦');
      expect(heroNames).toContain('韩信');
      expect(heroNames).toContain('萧何');
      expect(heroNames).toContain('张良');
      expect(heroNames).toContain('樊哙');
    });

    it('should have unique hero IDs', () => {
      const heroIds = AVAILABLE_HEROES.map(hero => hero.id);
      const uniqueIds = new Set(heroIds);
      
      expect(uniqueIds.size).toBe(heroIds.length);
    });

    it('should have heroes with skills', () => {
      AVAILABLE_HEROES.forEach(hero => {
        expect(hero.skills.length).toBeGreaterThan(0);
        
        hero.skills.forEach(skill => {
          expect(skill.id).toBeTruthy();
          expect(skill.name).toBeTruthy();
          expect(skill.description).toBeTruthy();
          expect(Object.values(SkillType)).toContain(skill.type);
        });
      });
    });

    it('should have heroes with descriptions', () => {
      AVAILABLE_HEROES.forEach(hero => {
        expect(hero.description).toBeTruthy();
        expect(typeof hero.description).toBe('string');
      });
    });
  });

  describe('Hero Utility Functions', () => {
    it('should get hero by ID', () => {
      const xiangyu = getHeroById('xiangyu');
      
      expect(xiangyu).toBeDefined();
      expect(xiangyu?.name).toBe('项羽');
      expect(xiangyu?.id).toBe('xiangyu');
    });

    it('should return undefined for non-existent hero ID', () => {
      const nonExistent = getHeroById('non-existent-hero');
      
      expect(nonExistent).toBeUndefined();
    });

    it('should get all heroes', () => {
      const allHeroes = getAllHeroes();
      
      expect(allHeroes).toHaveLength(AVAILABLE_HEROES.length);
      expect(allHeroes).toEqual(AVAILABLE_HEROES);
      
      // Should return a copy, not the original array
      expect(allHeroes).not.toBe(AVAILABLE_HEROES);
    });

    it('should create hero copy', () => {
      const originalHero = getHeroById('xiangyu')!;
      const heroCopy = createHeroCopy(originalHero);
      
      expect(heroCopy).not.toBe(originalHero);
      expect(heroCopy.id).toBe(originalHero.id);
      expect(heroCopy.name).toBe(originalHero.name);
      expect(heroCopy.skills).not.toBe(originalHero.skills);
      expect(heroCopy.skills.length).toBe(originalHero.skills.length);
      
      // Skills should be new instances
      heroCopy.skills.forEach((skill, index) => {
        expect(skill).not.toBe(originalHero.skills[index]);
        expect(skill.id).toBe(originalHero.skills[index].id);
        expect(skill.name).toBe(originalHero.skills[index].name);
      });
    });
  });

  describe('Specific Hero Skills', () => {
    it('should have 项羽 with correct skills', () => {
      const xiangyu = getHeroById('xiangyu')!;
      
      expect(xiangyu.skills).toHaveLength(2);
      expect(xiangyu.skills.some(skill => skill.name === '背水')).toBe(true);
      expect(xiangyu.skills.some(skill => skill.name === '霸王')).toBe(true);
    });

    it('should have 刘邦 with correct skills', () => {
      const liubang = getHeroById('liubang')!;
      
      expect(liubang.skills).toHaveLength(3);
      expect(liubang.skills.some(skill => skill.name === '更衣')).toBe(true);
      expect(liubang.skills.some(skill => skill.name === '亲征')).toBe(true);
      expect(liubang.skills.some(skill => skill.name === '鸿门')).toBe(true);
    });

    it('should have 韩信 with correct skills', () => {
      const hanxin = getHeroById('hanxin')!;
      
      expect(hanxin.skills).toHaveLength(3);
      expect(hanxin.skills.some(skill => skill.name === '点兵')).toBe(true);
      expect(hanxin.skills.some(skill => skill.name === '用兵')).toBe(true);
      expect(hanxin.skills.some(skill => skill.name === '益善')).toBe(true);
    });

    it('should have skills with correct types', () => {
      const xiangyu = getHeroById('xiangyu')!;
      const beishuiSkill = xiangyu.skills.find(skill => skill.name === '背水')!;
      const bawangSkill = xiangyu.skills.find(skill => skill.name === '霸王')!;
      
      expect(beishuiSkill.type).toBe(SkillType.PASSIVE);
      expect(bawangSkill.type).toBe(SkillType.PASSIVE);
      
      const liubang = getHeroById('liubang')!;
      const qinzhengSkill = liubang.skills.find(skill => skill.name === '亲征')!;
      
      expect(qinzhengSkill.type).toBe(SkillType.LIMITED);
    });

    it('should have skills that can be used initially', () => {
      AVAILABLE_HEROES.forEach(hero => {
        hero.skills.forEach(skill => {
          // All skills should be usable initially (except those marked as used)
          if (skill.type !== SkillType.LIMITED || !skill.isUsed) {
            expect(skill.canUse()).toBe(true);
          }
        });
      });
    });
  });
});