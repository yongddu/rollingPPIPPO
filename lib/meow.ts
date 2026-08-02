/**
 * A meow, synthesised in the browser.
 *
 * Shipping a recording would mean an audio file per variation and a
 * licence to worry about; a swept oscillator gets a cartoon meow for a
 * few hundred bytes and lets every cat have its own pitch.
 */
let context: AudioContext | null = null;

export function playMeow(pitch = 1) {
  if (typeof window === "undefined") return;

  try {
    context ??= new AudioContext();
    // browsers start the context suspended until a user gesture, which a
    // tap on a cat is
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    const duration = 0.4;
    const base = 620 * pitch;

    const osc = context.createOscillator();
    osc.type = "sawtooth";
    // the "me-ow" shape: pitch rises, then falls away
    osc.frequency.setValueAtTime(base * 0.72, now);
    osc.frequency.linearRampToValueAtTime(base * 1.28, now + 0.09);
    osc.frequency.linearRampToValueAtTime(base * 0.7, now + duration);

    const vibrato = context.createOscillator();
    vibrato.frequency.value = 17;
    const vibratoDepth = context.createGain();
    vibratoDepth.gain.value = base * 0.035;
    vibrato.connect(vibratoDepth).connect(osc.frequency);

    // a sweeping bandpass stands in for the vowel changing shape
    const formant = context.createBiquadFilter();
    formant.type = "bandpass";
    formant.Q.value = 5.5;
    formant.frequency.setValueAtTime(900 * pitch, now);
    formant.frequency.linearRampToValueAtTime(1750 * pitch, now + 0.1);
    formant.frequency.linearRampToValueAtTime(720 * pitch, now + duration);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(formant).connect(gain).connect(context.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
    vibrato.start(now);
    vibrato.stop(now + duration + 0.02);
  } catch {
    // audio is a garnish — never let it break tapping a cat
  }
}
