let lastSpeech='';
export function speak(english,rate=.87){
  lastSpeech=english;
  if(!('speechSynthesis' in window)) return false;
  speechSynthesis.cancel();
  const utter=new SpeechSynthesisUtterance(english);
  utter.lang='en-US';utter.rate=rate;utter.pitch=1.06;
  const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('en'));
  utter.voice=voices.find(v=>/en-us/i.test(v.lang))||voices[0]||null;
  speechSynthesis.speak(utter);return true;
}
export const repeatSpeech=()=>lastSpeech && speak(lastSpeech);
