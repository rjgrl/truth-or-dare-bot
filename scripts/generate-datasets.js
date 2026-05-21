/**
 * Generates 500+ truth and 500+ dare questions across all categories.
 * Run: npm run generate-data
 */
const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  'Funny',
  'Spicy',
  'Relationship',
  'Gaming',
  'Embarrassing',
  'School',
  'Dark Humor',
  'Couple',
  'Party',
  'Extreme',
];

const RATINGS = ['PG', 'PG13', 'PG13', 'PG13', 'R', 'NSFW'];

const TRUTH_TEMPLATES = {
  Funny: [
    'What is the dumbest thing you have done to make someone laugh?',
    'If you could swap lives with a cartoon character for a day, who would it be?',
    'What is your most useless hidden talent?',
    'What is the weirdest food combo you secretly enjoy?',
    'What meme describes your life right now?',
    'What is the funniest lie you have ever told?',
    'Who in this server would survive longest in a zombie apocalypse and why?',
    'What is your go-to dance move when nobody is watching?',
    'What is the most embarrassing song on your playlist?',
    'If your laugh was a sound effect, what would it be?',
  ],
  Spicy: [
    'What is your biggest turn-on that few people know about?',
    'What is the boldest text you have ever sent?',
    'Who was your most unexpected crush?',
    'What is something flirty you have wanted to say but never did?',
    'What outfit do you feel most confident in?',
    'What is your love language in three words?',
    'What is the most romantic thing someone has done for you?',
    'What is your type and why is it probably problematic?',
    'What song would you dedicate to your crush right now?',
    'What is the spiciest DM you have ever received?',
  ],
  Relationship: [
    'What is your biggest green flag in a partner?',
    'What is a dealbreaker you will not compromise on?',
    'What did a past relationship teach you about yourself?',
    'Who was your first crush and do they know?',
    'What is your idea of a perfect date night?',
    'What is the sweetest compliment you have ever received?',
    'How do you show someone you care without saying it?',
    'What is something you wish people asked you more often?',
    'What makes you feel most loved?',
    'What is your honest opinion on soulmates?',
  ],
  Gaming: [
    'What game do you pretend to be good at?',
    'What is your most toxic gaming habit?',
    'What is the longest you have grinded one game in a single day?',
    'What game made you rage-quit the hardest?',
    'Who here would you trust as your duo partner?',
    'What is your most embarrassing gaming moment?',
    'What game do you recommend to everyone?',
    'What is your main in your favorite game and why?',
    'What loot drop would you cry over IRL?',
    'What gaming hot take will get you cancelled?',
  ],
  Embarrassing: [
    'What is your most cringe childhood memory?',
    'What fashion phase do you regret the most?',
    'What is something you did in public you still think about at night?',
    'What nickname do you hope nobody brings up?',
    'What is the worst text you have sent to the wrong person?',
    'What talent show moment would you erase from history?',
    'What is your guilty pleasure TV show?',
    'What photo on your phone would you delete if someone saw it?',
    'What is the most awkward date you have been on?',
    'What autocorrect fail ruined your day?',
  ],
  School: [
    'What subject did you fake understanding the most?',
    'What is the boldest thing you did in class?',
    'Who was your secret school crush?',
    'What excuse worked too well on a teacher?',
    'What club or activity did you join just for friends?',
    'What is your most chaotic group project story?',
    'What did you procrastinate on until the last minute?',
    'What school rumor about you was actually true?',
    'What teacher secretly inspired you?',
    'What would you tell your freshman self?',
  ],
  'Dark Humor': [
    'What is your coping mechanism after a bad day?',
    'What is the darkest joke you laugh at anyway?',
    'What horror movie villain matches your mood today?',
    'What is something mildly cursed you find funny?',
    'What would your honest gravestone say?',
    'What is your spirit animal on a Monday?',
    'What is the most unhinged thought you had this week?',
    'What fictional death hit you harder than it should have?',
    'What is your honest review of adulthood so far?',
    'What would your villain origin story be?',
  ],
  Couple: [
    'What is your partner\'s most adorable habit?',
    'What song reminds you of your relationship?',
    'What is something you want to do together this year?',
    'What is your favorite memory with your partner?',
    'What pet name would you never say in public?',
    'What is your honest love language?',
    'What small thing does your partner do that means a lot?',
    'What trip would you plan together right now?',
    'What is your relationship superpower?',
    'What inside joke only you two understand?',
  ],
  Party: [
    'What is the wildest party you have ever been to?',
    'What drink order reveals your personality?',
    'What party game are you unbeatable at?',
    'What is your signature move on the dance floor?',
    'What is the best compliment you got at a party?',
    'What would your party DJ name be?',
    'What is your honest karaoke song?',
    'What house rule do you always break at parties?',
    'What is your pre-party ritual?',
    'What is the funniest thing you saw at a house party?',
  ],
  Extreme: [
    'What is the craziest thing on your bucket list?',
    'What dare would you never do no matter what?',
    'What is the most adrenaline you have ever felt?',
    'What rule would you break for $1000?',
    'What is your honest fear that holds you back?',
    'What stunt would you attempt with safety gear?',
    'What is the riskiest message you have sent?',
    'What would you do if you had zero consequences for one hour?',
    'What is your limit in Truth or Dare?',
    'What challenge would you accept right now?',
  ],
};

const DARE_TEMPLATES = {
  Funny: [
    'Do your best impression of another player for 30 seconds.',
    'Speak in an accent for the next 3 rounds.',
    'Post the last emoji you used in your most recent chat.',
    'Let the group pick a word you must say after every sentence for 2 rounds.',
    'Do a dramatic reading of the last message in this channel.',
    'Balance something on your head for 20 seconds on camera.',
    'Send a voice note saying "I am the drama" in your best soap voice.',
    'Rename your Discord status to something the group chooses for 1 hour.',
    'Do 10 jumping jacks and post proof.',
    'Let someone draw on your face with a filter and show the camera.',
  ],
  Spicy: [
    'Send a flirty compliment to the third person above you in chat.',
    'Whisper your hottest take about dating in voice chat.',
    'Post your most recent liked photo (SFW only).',
    'Let the group pick your profile picture for 30 minutes (SFW).',
    'Send a "thinking about you" text to someone the group names.',
    'Describe your type in three spicy words.',
    'Do your best pick-up line to the camera.',
    'Share the last song you had on repeat.',
    'React to the last 5 messages in general with only fire emojis.',
    'Post a selfie with your best "main character" pose.',
  ],
  Relationship: [
    'Text someone you appreciate one genuine compliment right now.',
    'Share your honest green flag about the person to your left (or random pick).',
    'Post a photo that makes you feel confident.',
    'Say three things you value in a friendship out loud.',
    'Send a heart emoji to the last person who messaged you.',
    'Describe your dream date in 15 seconds on voice.',
    'Share a relationship advice hot take.',
    'Post the song that reminds you of someone special.',
    'Give a shout-out to someone in the server who deserves it.',
    'Write a two-line poem about love and post it.',
  ],
  Gaming: [
    'Play one quick match of your main game and share the result.',
    'Change your Discord status to your current rank for 1 hour.',
    'Share a screenshot of your most played game this month.',
    'Let the group pick your next game to launch.',
    'Do a 1-minute rant about your least favorite game mechanic.',
    'Post your gaming hot take and defend it.',
    'Say your main\'s ultimate voice line out loud.',
    'Share your worst gaming purchase.',
    'Challenge someone here to a duel in any game.',
    'Post a clip or image from your favorite gaming moment.',
  ],
  Embarrassing: [
    'Show the oldest photo in your camera roll on camera.',
    'Read your most embarrassing search out loud (keep it SFW).',
    'Do your worst dance for 15 seconds.',
    'Let the group pick an emoji you must use in your next 3 messages.',
    'Post a childhood photo if you have one.',
    'Sing one line of a song you are bad at.',
    'Share a cringe status you posted years ago.',
    'Do your best celebrity impression.',
    'Post your screen time report for today.',
    'Say something nice about yourself while maintaining eye contact with the camera.',
  ],
  School: [
    'Recite something you memorized for school in dramatic fashion.',
    'Share your most chaotic study hack.',
    'Post a picture of your desk or study setup.',
    'Do a 20-second presentation on a random topic the group picks.',
    'Share your honest GPA or grade story (if comfortable).',
    'Text a classmate something wholesome right now.',
    'Post the subject you would delete from school forever.',
    'Share your best teacher impression.',
    'Read a note from your notes app out loud.',
    'Post your school survival tip.',
  ],
  'Dark Humor': [
    'Tell your best dark joke (keep it within server rules).',
    'Do a horror movie trailer voice for 15 seconds.',
    'Share your unhinged opinion on pineapple pizza.',
    'Post your honest Monday mood in one gif.',
    'Describe your week as a movie title.',
    'Do a dramatic monologue about being tired.',
    'Share a cursed food combo you enjoy.',
    'Post a meme that represents your brain at 3 AM.',
    'Say your villain catchphrase.',
    'Rank the group by who would survive a horror movie.',
  ],
  Couple: [
    'Send your partner or crush a genuine compliment right now.',
    'Share a photo you took together or a favorite memory.',
    'Post three things you love about your partner.',
    'Do a 10-second love song dedication on voice.',
    'Share your couple aesthetic in three emojis.',
    'Text "you up?" to your partner as a joke (if applicable).',
    'Post your relationship status in creative words only.',
    'Share your next date idea out loud.',
    'Do a synchronized clap with your partner on cam if possible.',
    'Write a cheesy pickup line for your partner and post it.',
  ],
  Party: [
    'Take a sip (or pretend sip) and post a party selfie.',
    'Start a 30-second dance party on camera.',
    'Cheers everyone in voice chat by name.',
    'Post your best party trick.',
    'Let the group pick your drink (or snack) for the next round.',
    'Do a toast to the friend group.',
    'Share your party playlist link or top song.',
    'Play rock paper scissors with the camera and post result.',
    'Post a photo with your best party face.',
    'Shout your favorite party memory in voice.',
  ],
  Extreme: [
    'Do 20 push-ups or squats on camera.',
    'Let the group dare you one extra mild challenge.',
    'Post proof of completing the last dare within 5 minutes.',
    'Say yes to the next dare no matter what (within reason).',
    'Cold shower challenge: splash water on your face and post reaction.',
    'Eat a spoon of a condiment the group picks (if safe).',
    'Go live in voice for 1 minute and hype the group.',
    'Post your most chaotic friend group photo.',
    'Do an ice cube challenge for 10 seconds.',
    'Share a bucket list item you will do this month.',
  ],
};

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function expandTemplates(templates, category, type, startId, countPerCategory) {
  const base = templates[category] || [];
  const items = [];
  let id = startId;
  for (let i = 0; i < countPerCategory; i++) {
    const template = base[i % base.length];
    const variant = i >= base.length ? ` (round ${Math.floor(i / base.length) + 1})` : '';
    const rating =
      category === 'Spicy' || category === 'Extreme'
        ? RATINGS[Math.floor(Math.random() * RATINGS.length)]
        : category === 'Dark Humor'
          ? i % 5 === 0
            ? 'R'
            : 'PG13'
          : 'PG13';
    items.push({
      id: id++,
      question:
        type === 'truth'
          ? template.replace(/\?$/, '') + variant + '?'
          : template.replace(/\.$/, '') + variant + '.',
      category,
      rating: rating === 'NSFW' && category !== 'Spicy' && category !== 'Extreme' ? 'PG13' : rating,
      enabled: true,
    });
  }
  return { items, nextId: id };
}

function writeCategoryFiles(type, dir, templates, perCategory) {
  fs.mkdirSync(dir, { recursive: true });
  let id = 1;
  let total = 0;
  for (const category of CATEGORIES) {
    const { items, nextId } = expandTemplates(templates, category, type, id, perCategory);
    id = nextId;
    total += items.length;
    const file = path.join(dir, `${slugify(category)}.json`);
    fs.writeFileSync(file, JSON.stringify(items, null, 2));
    console.log(`  ${file} — ${items.length} entries`);
  }
  return total;
}

function generateNhie(count = 120) {
  const stems = [
    'never have I ever fallen asleep during a voice call',
    'never have I ever pretended to be AFK to avoid a dare',
    'never have I ever had a crush on someone in this server',
    'never have I ever rage quit a game',
    'never have I ever sent a text to the wrong person',
    'never have I ever lied about watching a popular show',
    'never have I ever been kicked from a voice channel',
    'never have I ever used a fake name online',
    'never have I ever stayed up until sunrise gaming',
    'never have I ever forgotten a friend\'s birthday',
    'never have I ever stalked someone\'s profile before replying',
    'never have I ever laughed at the wrong moment',
    'never have I ever eaten food off the floor',
    'never have I ever blamed lag for losing',
    'never have I ever had a parasocial moment',
  ];
  const items = [];
  for (let i = 0; i < count; i++) {
    const stem = stems[i % stems.length];
    const suffix = i >= stems.length ? ` #${Math.floor(i / stems.length) + 1}` : '';
    items.push({
      id: i + 1,
      statement: stem.charAt(0).toUpperCase() + stem.slice(1) + suffix + '.',
      category: CATEGORIES[i % CATEGORIES.length],
      rating: 'PG13',
      enabled: true,
    });
  }
  return items;
}

function main() {
  const root = path.join(__dirname, '..', 'data');
  const truthsDir = path.join(root, 'truths');
  const daresDir = path.join(root, 'dares');
  const perCategory = 55; // 10 * 55 = 550 per type

  console.log('Generating truth questions...');
  const truthTotal = writeCategoryFiles('truth', truthsDir, TRUTH_TEMPLATES, perCategory);
  console.log(`Truths total: ${truthTotal}`);

  console.log('Generating dare questions...');
  const dareTotal = writeCategoryFiles('dare', daresDir, DARE_TEMPLATES, perCategory);
  console.log(`Dares total: ${dareTotal}`);

  fs.writeFileSync(
    path.join(root, 'nhie.json'),
    JSON.stringify(generateNhie(120), null, 2)
  );
  console.log('Wrote nhie.json (120)');

  fs.writeFileSync(
    path.join(root, 'daily-challenges.json'),
    JSON.stringify(
      {
        challenges: [
          'Answer two truths and complete one dare before midnight.',
          'Compliment three people in the server today.',
          'Win one game with a friend from this server.',
          'Share your funniest meme of the day.',
          'Do a 30-second voice impression in VC.',
          'Post a throwback photo or story.',
          'Try a dare from the Extreme category.',
          'Start a mini party with /party start.',
          'Submit a question for the group with /submit.',
          'Spin the punishment wheel once.',
        ],
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(root, 'punishments.json'),
    JSON.stringify(
      {
        punishments: [
          'Take a sip of water dramatically.',
          'Change your nickname to something silly for 1 hour.',
          'Post a cat or dog gif.',
          'Speak only in caps for the next 3 messages.',
          'Do 15 seconds of plank.',
          'Send a wholesome compliment to a random member.',
          'Share your most played song this week.',
          'Use only emoji for your next reply.',
          'Tell a dad joke in voice chat.',
          'Post a selfie with a filter.',
        ],
      },
      null,
      2
    )
  );

  fs.writeFileSync(path.join(root, 'leaderboard.json'), JSON.stringify({}, null, 2));
  fs.writeFileSync(path.join(root, 'settings.json'), JSON.stringify({}, null, 2));
  fs.writeFileSync(
    path.join(root, 'submissions.json'),
    JSON.stringify({ pending: [], approved: [], rejected: [] }, null, 2)
  );

  console.log('\nDone! Run the bot with: npm start');
}

main();
