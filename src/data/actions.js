// A reusable action is distinct from its contextual English sentence.
// Each action describes a physical animation recipe and state transitions.
const rule = (recipe, requires = {}, effects = {}, duration = 900) => ({ recipe, requires, effects, duration });
export const ACTIONS = {
  pick_up: rule('pickup', { held: false }, { held: true }),
  put_down: rule('place', { held: true }, { held: false }),
  put_back: rule('place', { held: true }, { held: false, stored: false }),
  put_away: rule('place', { held: true }, { held: false, stored: true }),
  take_out: rule('pickup', { stored: true }, { held: true, stored: false }),
  turn_on: rule('switch', { on: false }, { on: true }),
  turn_off: rule('switch', { on: true }, { on: false }),
  open_up: rule('open', { open: false }, { open: true }),
  close: rule('open', { open: true }, { open: false }),
  put_on: rule('dress', { worn: false }, { worn: true, held: false, hung: false }),
  take_off: rule('dress', { worn: true }, { worn: false, held: true }),
  hang_up: rule('place', { hung: false }, { hung: true, held: false }),
  take_down: rule('pickup', { hung: true }, { hung: false, held: true }),
  sit_down: rule('sit', { sitting: false }, { sitting: true }),
  stand_up: rule('sit', { sitting: true }, { sitting: false }),
  lie_down: rule('sit', { lying: false }, { lying: true }),
  get_up: rule('sit', { lying: true }, { lying: false }),
  wake_up: rule('sit', { awake: false }, { awake: true }),
  look_at: rule('look'),
  look_for: rule('look'),
  look_through: rule('look'),
  look_out: rule('look'),
  clean_up: rule('clean', { clean: false }, { clean: true }),
  tidy_up: rule('clean', { tidy: false }, { tidy: true }),
  make_bed: rule('clean', { made: false }, { made: true }),
  eat_up: rule('eat', { eaten: false }, { eaten: true }),
  drink_up: rule('eat', { empty: false }, { empty: true }),
  throw_away: rule('place', { discarded: false }, { discarded: true, held: false }),
  bring_back: rule('pickup', { discarded: true }, { discarded: false, held: true }),
  wash_up: rule('clean', { clean: false }, { clean: true }),
  dry_off: rule('clean', { wet: true }, { wet: false }),
  cut_up: rule('clean', { cut: false }, { cut: true }),
  pour_in: rule('place', { empty: true }, { empty: false }),
  set_up: rule('place', { set: false }, { set: true }),
  switch_on: rule('switch', { on: false }, { on: true }),
  switch_off: rule('switch', { on: true }, { on: false }),
  move_away: rule('walk'),
  come_back: rule('walk'),
  go_out: rule('walk'),
  come_in: rule('walk'),
  brush_teeth: rule('clean',{}, {},1200),
  shave_face: rule('clean',{}, {},1600),
  smile_face: rule('look',{}, {},800),
  cry_face: rule('look',{}, {},1100),
  blink_eyes: rule('look',{}, {},700),
  shout_face: rule('look',{}, {},900),
  put_on_shirt: rule('dress',{}, {},1200),
  put_on_suit: rule('dress',{}, {},1400),
  take_off_shirt: rule('dress',{}, {},1200),
  put_on_pajamas: rule('dress',{}, {},1400)
};

export function isAvailable(object, phrase) {
  const action = ACTIONS[phrase.action];
  if (!action) return false;
  return Object.entries(action.requires).every(([k, v]) => (object.state[k] ?? false) === v);
}
export function applyAction(object, phrase) {
  const action = ACTIONS[phrase.action];
  if (!action || !isAvailable(object, phrase)) return false;
  Object.assign(object.state, action.effects);
  return true;
}
