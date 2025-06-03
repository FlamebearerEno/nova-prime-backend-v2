const express = require('express');
const router = express.Router();
const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const BUCKET_NAME = process.env.WASABI_BUCKET_NAME; // Updated here! ✅
const s3 = require('../utils/wasabiClient'); // Your configured Wasabi SDK client

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Read object from Wasabi (returns JSON)
async function getObject(key) {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const response = await s3.send(command);
  const chunks = [];
  for await (let chunk of response.Body) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

// Write object to Wasabi
async function putObject(key, body) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(body, null, 2),
    ContentType: 'application/json',
  });
  await s3.send(command);
}

// Load global daily quests from Wasabi
async function getGlobalDailyQuests() {
  return await getObject('knowledge/daily_quests.json');
}

// GET daily quests for user
router.get('/daily_quests', async (req, res) => {
  const userId = req.user.uid;
  const userKey = `logs/${userId}/${userId}_daily_quests.json`;

  try {
    const today = getTodayDate();
    const globalQuests = await getGlobalDailyQuests();

    let userQuests;
    try {
      userQuests = await getObject(userKey);
      const isStale = userQuests.dateGenerated !== today || 
                      globalQuests.some(gq => !userQuests.quests.find(uq => uq.id === gq.id));

      if (!isStale) {
        return res.json(userQuests); // Return user's existing quests
      }
    } catch {
      // User file missing, will create
    }

    // Refresh user quests
    const newUserQuests = {
      dateGenerated: today,
      quests: globalQuests.map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        completed: false,
        memoryShards: q.memoryShards,
      })),
    };

    await putObject(userKey, newUserQuests);
    res.json(newUserQuests);
  } catch (err) {
    console.error('Error fetching daily quests:', err);
    res.status(500).json({ error: 'Failed to fetch daily quests.' });
  }
});

// POST - Mark quest complete + add Memory Shards
router.post('/complete_quest', async (req, res) => {
  const userId = req.user.uid;
  const { questId, memoryShards } = req.body;
  const statsKey = `logs/${userId}/${userId}_user_stats.json`;
  const userQuestsKey = `logs/${userId}/${userId}_daily_quests.json`;

  try {
    let stats;
    try {
      stats = await getObject(statsKey);
    } catch {
      stats = { memoryShards: 0, questsCompleted: 0 };
    }

    stats.memoryShards += memoryShards;
    stats.questsCompleted += 1;

    const userQuests = await getObject(userQuestsKey);
    const quest = userQuests.quests.find(q => q.id === questId);
    if (quest) quest.completed = true;

    await putObject(statsKey, stats);
    await putObject(userQuestsKey, userQuests);

    res.json({ message: 'Quest completion recorded.', stats });
  } catch (err) {
    console.error('Error completing quest:', err);
    res.status(500).json({ error: 'Failed to update quest.' });
  }
});

module.exports = router;
