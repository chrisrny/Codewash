import {
    Target,
    Trophy,
    Zap,
    Heart,
    Skull,
    Swords,
    Crown,
    Shield,
    Sparkles,
    Paintbrush,
    Frame,
    CheckCircle,
    Timer,
    Calendar,
    TrendingUp,
    Award,
    Ghost,
    Users,
    Gem,
} from 'lucide-react';
import { t } from '../i18n';

/**
 * Achievement Definitions
 * Each achievement needs: id, icon, category
 * Tiered achievements have: tiers (array of tier objects with level)
 * Les noms et descriptions sont dans src/i18n : achievement.<id>.name, .desc, .tier1 à .tier8
 */

// Tier colors for visual progression
export const TIER_COLORS = {
    1: { border: '#8B4513', bg: '#8B4513/20', text: 'text-amber-700' }, // Bronze
    2: { border: '#C0C0C0', bg: '#C0C0C0/20', text: 'text-gray-400' }, // Silver
    3: { border: '#FFD700', bg: '#FFD700/20', text: 'text-yellow-400' }, // Gold
    4: { border: '#E5E4E2', bg: '#E5E4E2/20', text: 'text-gray-300' }, // Platinum
    5: { border: '#50C878', bg: '#50C878/20', text: 'text-emerald-400' }, // Emerald
    6: { border: '#B9F2FF', bg: '#B9F2FF/20', text: 'text-cyan-300' }, // Diamond
    7: { border: '#8B00FF', bg: '#8B00FF/20', text: 'text-purple-400' }, // Legendary
    8: { border: '#FF1493', bg: '#FF1493/20', text: 'text-pink-500' }, // Mythic
};

// ============================================
// TIERED ACHIEVEMENTS
// ============================================

export const PHANTOM_HUNTER_TIERS = [
    { level: 5 },
    { level: 10 },
    { level: 15 },
    { level: 20 },
    { level: 25 },
    { level: 50 },
    { level: 75 },
    { level: 100 },
];

export const COMBINED_LEVEL_TIERS = [
    { level: 100 },
    { level: 200 },
    { level: 300 },
    { level: 400 },
    { level: 500 },
    { level: 600 },
    { level: 700 },
    { level: 800 },
];

export const SKILL_MASTERY_TIERS = [
    { level: 20 },
    { level: 40 },
    { level: 60 },
    { level: 80 },
    { level: 100 },
    { level: 120 },
    { level: 140 },
    { level: 160 },
];

// ============================================
// ALL ACHIEVEMENTS
// ============================================

export const ACHIEVEMENTS = {
    // Tiered Achievements
    phantom_hunter: {
        id: 'phantom_hunter',
        icon: Ghost,
        category: 'combat',
        isTiered: true,
        tiers: PHANTOM_HUNTER_TIERS,
        getProgress: (stats) => stats.phantomsCaught || 0,
    },

    combined_levels: {
        id: 'combined_levels',
        icon: TrendingUp,
        category: 'progression',
        isTiered: true,
        tiers: COMBINED_LEVEL_TIERS,
        getProgress: (stats, skills) => {
            return Object.values(skills).reduce((sum, skill) => sum + (skill.level || 0), 0);
        },
    },

    skill_mastery: {
        id: 'skill_mastery',
        icon: Award,
        category: 'progression',
        isTiered: true,
        tiers: SKILL_MASTERY_TIERS,
        getProgress: (stats, skills) => {
            const levels = Object.values(skills).map((s) => s.level || 0);
            return Math.min(...levels); // Minimum level across all skills
        },
        getProgressText: (stats, skills) => {
            const levels = Object.values(skills).map((s) => s.level || 0);
            const minLevel = Math.min(...levels);
            const count = levels.filter((l) => l >= minLevel).length;
            return t('achievement.skill_mastery.progress', { count, level: minLevel });
        },
    },

    // One-Time Achievements
    first_steps: {
        id: 'first_steps',
        icon: Target,
        category: 'combat',
        isTiered: false,
        checkUnlock: (stats) => (stats.totalMobsDefeated || 0) >= 1,
    },

    level_up: {
        id: 'level_up',
        icon: Zap,
        category: 'progression',
        isTiered: false,
        checkUnlock: (stats, skills) => {
            return Object.values(skills).some((s) => (s.level || 0) >= 2);
        },
    },

    fashion_forward: {
        id: 'fashion_forward',
        icon: Paintbrush,
        category: 'customization',
        isTiered: false,
        checkUnlock: (stats) => (stats.themeChanges || 0) >= 1,
    },

    framed: {
        id: 'framed',
        icon: Frame,
        category: 'customization',
        isTiered: false,
        checkUnlock: (stats) => (stats.borderChanges || 0) >= 1,
    },

    ouch: {
        id: 'ouch',
        icon: Skull,
        category: 'combat',
        isTiered: false,
        checkUnlock: (stats) => (stats.totalDeaths || 0) >= 1,
    },

    dragon_slayer: {
        id: 'dragon_slayer',
        icon: Crown,
        category: 'combat',
        isTiered: false,
        checkUnlock: (stats) => (stats.totalBossesDefeated || 0) >= 1,
    },

    mini_menace: {
        id: 'mini_menace',
        icon: Shield,
        category: 'combat',
        isTiered: false,
        checkUnlock: (stats) => (stats.totalMinibossesDefeated || 0) >= 1,
    },

    mini_master: {
        id: 'mini_master',
        icon: Swords,
        category: 'completion',
        isTiered: false,
        checkUnlock: (stats) => {
            // 4 minibosses: Creaking, Elder Guardian, Ravager, Wither Skeleton
            const requiredMinibosses = ['Creaking', 'Elder Guardian', 'Ravager', 'Wither Skeleton'];
            const defeated = stats.uniqueMinibossesDefeated || [];
            return requiredMinibosses.every((mb) => defeated.includes(mb));
        },
    },

    world_ender: {
        id: 'world_ender',
        icon: Trophy,
        category: 'completion',
        isTiered: false,
        checkUnlock: (stats) => {
            // 4 bosses: Ender Dragon, Herobrine, Warden, Wither
            const requiredBosses = ['Ender Dragon', 'Herobrine', 'Warden', 'Wither'];
            const defeated = stats.uniqueBossesDefeated || [];
            return requiredBosses.every((b) => defeated.includes(b));
        },
    },

    monster_manual: {
        id: 'monster_manual',
        icon: Users,
        category: 'completion',
        isTiered: false,
        checkUnlock: (stats) => {
            // 20 hostile mobs from HOSTILE_MOBS
            const requiredMobs = [
                'Blaze',
                'Bogged',
                'Breeze',
                'Creeper',
                'Drowned',
                'Enderman',
                'Evoker',
                'Ghast',
                'Guardian',
                'Hoglin',
                'Magma Cube',
                'Parched',
                'Phantom',
                'Piglin',
                'Pillager',
                'Skeleton',
                'Slime',
                'Spider',
                'Witch',
                'Zombie',
            ];
            const defeated = stats.uniqueMobsDefeated || [];
            return requiredMobs.every((m) => defeated.includes(m));
        },
    },

    perfectionist: {
        id: 'perfectionist',
        icon: CheckCircle,
        category: 'skill',
        isTiered: false,
        checkUnlock: (stats) => (stats.perfectMemoryGames || 0) >= 1,
    },

    speed_demon: {
        id: 'speed_demon',
        icon: Timer,
        category: 'skill',
        isTiered: false,
        checkUnlock: (stats) => (stats.battlesThisSession || 0) >= 10,
    },

    dedicated: {
        id: 'dedicated',
        icon: Calendar,
        category: 'engagement',
        isTiered: false,
        checkUnlock: (stats) => {
            const loginDates = stats.loginDates || [];
            return loginDates.length >= 3;
        },
    },

    high_roller: {
        id: 'high_roller',
        icon: Sparkles,
        category: 'progression',
        isTiered: false,
        checkUnlock: (stats, skills) => {
            return Object.values(skills).some((s) => (s.difficulty || 1) >= 7);
        },
    },

    badge_collector: {
        id: 'badge_collector',
        icon: Gem,
        category: 'progression',
        isTiered: false,
        checkUnlock: (stats, skills) => {
            return Object.values(skills).some((s) => s.earnedBadges && s.earnedBadges.length > 0);
        },
    },

    full_set: {
        id: 'full_set',
        icon: Heart,
        category: 'progression',
        isTiered: false,
        checkUnlock: (stats, skills) => {
            return Object.values(skills).some((s) => s.earnedBadges && s.earnedBadges.length >= 8);
        },
    },
};

// Helper to get all achievements as array
export const getAllAchievements = () => Object.values(ACHIEVEMENTS);

// Helper to get achievements by category
export const getAchievementsByCategory = (category) => {
    return getAllAchievements().filter((a) => a.category === category);
};
