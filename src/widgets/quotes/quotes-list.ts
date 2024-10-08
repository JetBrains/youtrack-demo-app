const quotes: Array<[quote: string, author: string]> = [
  ['You are never too old to set another goal or to dream a new dream.', 'C. S. Lewis'],
  ['With the new day comes new strength and new thoughts.', 'Eleanor Roosevelt'],
  ['The will to win, the desire to succeed, the urge to reach your full potential... these are the keys that will unlock the door to personal excellence.', 'Confucius'],
  ['Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.', 'Thomas A. Edison'],
  ['Be miserable. Or motivate yourself. Whatever has to be done, it\'s always your choice.', 'Wayne Dyer'],
  ['Always do your best. What you plant now, you will harvest later.', 'Og Mandino'],
  ['I don\'t believe you have to be better than everybody else. I believe you have to be better than you ever thought you could be.', 'Ken Venturi'],
  ['Always continue the climb. It is possible for you to do whatever you choose, if you first get to know who you are and are willing to work with a power that is greater than ourselves to do it.', 'Ella Wheeler Wilcox'],
  ['Expect problems and eat them for breakfast.', 'Alfred A. Montapert'],
  ['Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.', 'Helen Keller'],
  ['Learn from the past, set vivid, detailed goals for the future, and live in the only moment of time over which you have any control: now.', 'Denis Waitley'],
  ['If you can dream it, you can do it.', 'Walt Disney'],
  ['Do you want to know who you are? Don\'t ask. Act! Action will delineate and define you.', 'Thomas Jefferson'],
  ['Even if you fall on your face, you\'re still moving forward.', 'Victor Kiam'],
  ['The key is to keep company only with people who uplift you, whose presence calls forth your best.', 'Epictetus'],
  ['By failing to prepare, you are preparing to fail.', 'Benjamin Franklin'],
  ['You have to learn the rules of the game. And then you have to play better than anyone else.', 'Albert Einstein'],
  ['Either you run the day or the day runs you.', 'Jim Rohn'],
  ['Act as if what you do makes a difference. It does.', 'William James'],
  ['I know where I\'m going and I know the truth, and I don\'t have to be what you want me to be. I\'m free to be what I want.', 'Muhammad Ali'],
  ['Be Impeccable With Your Word. Speak with integrity. Say only what you mean. Avoid using the word to speak against yourself or to gossip about others. Use the power of your word in the direction of truth and love.', 'Miguel Angel Ruiz'],
  ['Determine never to be idle. No person will have occasion to complain of the want of time who never loses any. It is wonderful how much may be done if we are always doing.', 'Thomas Jefferson']
];

export function getRandomQuote(): [quote: string, author: string] {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}
