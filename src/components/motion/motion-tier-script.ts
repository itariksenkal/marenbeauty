/**
 * Resolves the motion tier BEFORE first paint and writes it to
 * <html data-motion-tier>.
 *
 * Inline and synchronous on purpose: if the tier were resolved after
 * hydration, animated content would flash before being told not to animate.
 * That is the same class of bug as the skip link rendering in flow before its
 * stylesheet arrived (docs/OPEN-QUESTIONS.md G8).
 *
 * Detection APIs here are Chromium-only. Their absence means `full` — we do not
 * degrade Safari and Firefox for not reporting (docs/MOTION.md §6).
 */
export const MOTION_TIER_SCRIPT = `(function(){try{
var d=document.documentElement,t='full';
var p=new URLSearchParams(location.search).get('motion');
var n=navigator,c=n.connection||{};
if(n.deviceMemory&&n.deviceMemory<=4)t='static';
else if(n.hardwareConcurrency&&n.hardwareConcurrency<=4)t='static';
else if(c.saveData===true)t='static';
if(matchMedia('(prefers-reduced-data: reduce)').matches)t='static';
if(matchMedia('(prefers-reduced-motion: reduce)').matches)t='reduced';
if(__DEV__&&(p==='full'||p==='reduced'||p==='static'))t=p;
d.dataset.motionTier=t;
}catch(e){document.documentElement.dataset.motionTier='full';}})();`;

/**
 * The `?motion=` override is a QA affordance and must not exist in production
 * — otherwise any visitor could force a tier. The flag is substituted at build
 * time so the branch is a literal `false` in production and disappears.
 */
export function motionTierScript(isDev: boolean): string {
  return MOTION_TIER_SCRIPT.replace('__DEV__', isDev ? 'true' : 'false');
}
