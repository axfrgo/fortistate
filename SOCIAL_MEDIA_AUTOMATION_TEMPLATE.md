# Social Media Automation Template

**Template ID**: `automation-social-media`  
**Category**: Automation  
**Icon**: 📱  
**Date Added**: October 10, 2025

## Overview

A complete social media automation pipeline that orchestrates the entire content lifecycle from generation to publication and user notification. This template demonstrates how to build complex multi-step workflows using Fortistate's ontogenetic operators.

## Workflow Description

### Pipeline Steps

1. **Campaign Initialization** (BEGIN)
   - Creates a new weekly campaign entity
   - Initializes tracking counters (posts generated, scheduled, published)
   - Sets campaign status to "initialized"

2. **Content Generation** (BECOME)
   - Triggers ChatGPT API request for 7 social media posts
   - Each post is tailored for daily publication
   - Updates campaign status to "generating"
   - Sets `postsGenerated = 7`

3. **Calendar Scheduling** (BECOME)
   - Takes generated posts and adds them to content calendar
   - Schedules one post per day (Monday through Sunday)
   - Updates campaign status to "scheduled"
   - Sets `postsScheduled = 7`

4. **Daily Publication** (BECOME - Looping)
   - Executes once per day at scheduled time
   - Publishes the day's post to social media platforms
   - Increments `postsPublished` counter
   - Increments `currentDay` counter
   - **Loops 7 times** (self-referencing edge)

5. **Week Completion** (CEASE)
   - Triggers when `postsPublished === 7`
   - Sends notification to user: "Content week has been completed"
   - Marks campaign as complete
   - Action: `send notification`

6. **Next Week Rollover** (TRANSCEND)
   - Optional: Automatically start next week's campaign
   - Portal to new campaign entity: `campaign:next-week`
   - Condition: Previous campaign status is "completed"

## Entity Structure

```typescript
entity: 'campaign:weekly'

properties: {
  status: 'initialized' | 'generating' | 'scheduled' | 'publishing' | 'completed'
  postsGenerated: number    // Target: 7
  postsScheduled: number    // Target: 7
  postsPublished: number    // Increments from 0 to 7
  currentDay: number        // Day of week (0-6 or 1-7)
}
```

## Node Details

### 1. BEGIN - Campaign Initialization
- **Entity**: `campaign:weekly`
- **Initial Properties**:
  ```json
  {
    "status": "initialized",
    "postsGenerated": 0,
    "postsScheduled": 0,
    "postsPublished": 0,
    "currentDay": 0
  }
  ```
- **Narrative**: "🌱 Social media campaign initialized"

### 2. BECOME - Generate Posts
- **Entity**: `campaign:weekly`
- **Transform**: `status = "generating", postsGenerated = 7`
- **Trigger**: `request ChatGPT API for 7 posts`
- **Narrative**: "🤖 ChatGPT generates 7 posts for the week"
- **Integration Point**: ChatGPT API call

### 3. BECOME - Schedule to Calendar
- **Entity**: `campaign:weekly`
- **Transform**: `status = "scheduled", postsScheduled = 7`
- **Trigger**: `add posts to calendar (Mon-Sun)`
- **Narrative**: "📅 Posts scheduled to calendar for each day"
- **Integration Point**: Calendar API (Google Calendar, internal calendar, etc.)

### 4. BECOME - Daily Post Publication
- **Entity**: `campaign:weekly`
- **Transform**: `postsPublished++, currentDay++`
- **Trigger**: `daily trigger (24h interval)`
- **Narrative**: "📤 Daily post published (repeats 7 times)"
- **Loop Mechanism**: Self-referencing edge (dashed orange line)
- **Integration Point**: Social media APIs (Twitter, LinkedIn, Facebook, Instagram)

### 5. CEASE - Week Complete Notification
- **Entity**: `campaign:weekly`
- **Condition**: `postsPublished === 7`
- **Action**: `send notification`
- **Narrative**: "✅ Week complete! Send completion message to user"
- **Integration Point**: Email, SMS, or in-app notification service

### 6. TRANSCEND - Next Week Campaign
- **Entity**: `campaign:weekly`
- **Portal**: `campaign:next-week`
- **Condition**: `status === "completed"`
- **Narrative**: "🔄 Start new week's campaign automatically"
- **Purpose**: Enables continuous automation

## Edge Flow

```
BEGIN (Initialize)
  ↓ [Green - Creation]
BECOME (Generate Posts via ChatGPT)
  ↓ [Blue - Transformation]
BECOME (Schedule to Calendar)
  ↓ [Blue - Transformation]
BECOME (Publish Daily) ⟲ [Orange Dashed - Loop 7x]
  ↓ [Blue - When complete]
CEASE (Send Completion Notification)
  ↓ [Purple - Universe crossing]
TRANSCEND (Start Next Week)
```

## Implementation Notes

### Required Integrations

1. **ChatGPT API** (OpenAI)
   ```typescript
   // Example integration at BECOME (Generate Posts)
   const response = await openai.chat.completions.create({
     model: "gpt-4",
     messages: [{
       role: "system",
       content: "Generate 7 engaging social media posts for this week..."
     }]
   })
   ```

2. **Calendar API** (Google Calendar or similar)
   ```typescript
   // Example integration at BECOME (Schedule)
   for (let i = 0; i < 7; i++) {
     await calendar.events.insert({
       calendarId: 'primary',
       resource: {
         summary: posts[i],
         start: { dateTime: getDateForDay(i) },
         end: { dateTime: getDateForDay(i) }
       }
     })
   }
   ```

3. **Social Media APIs**
   - Twitter API v2
   - LinkedIn API
   - Facebook Graph API
   - Instagram Graph API
   - Buffer/Hootsuite APIs (optional schedulers)

4. **Notification Service**
   - SendGrid (email)
   - Twilio (SMS)
   - Push notifications
   - Slack webhooks
   - Discord webhooks

### Timer/Scheduler Requirements

The **BECOME (Daily Post)** node requires a scheduling mechanism:

**Option 1: Cron Job**
```typescript
// Runs daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  await publishDailyPost()
})
```

**Option 2: Scheduled Cloud Function**
```typescript
// Firebase/AWS Lambda scheduled function
export const publishDaily = functions.pubsub
  .schedule('0 9 * * *')
  .onRun(async (context) => {
    await publishDailyPost()
  })
```

**Option 3: Workflow Scheduler**
```typescript
// Using workflow engines like Temporal, Airflow
await workflow.sleep('24 hours')
```

### Loop Implementation

The self-referencing edge on **BECOME (Daily Post)** represents a loop:

```typescript
// Pseudo-code for loop logic
while (campaign.postsPublished < 7) {
  await publishPost(campaign.posts[campaign.currentDay])
  campaign.postsPublished++
  campaign.currentDay++
  await sleep(24 * 60 * 60 * 1000) // 24 hours
}
```

## Use Cases

### 1. **Personal Brand Management**
- Solo entrepreneurs managing their own social presence
- Automated weekly content with minimal manual intervention
- Focus on content strategy, not execution

### 2. **Small Business Marketing**
- Consistent social media presence without hiring a social media manager
- Pre-planned content campaigns
- Automated reporting to business owner

### 3. **Agency Workflow**
- Manage multiple client campaigns
- Each client gets their own campaign entity
- Standardized workflow across all clients

### 4. **Content Creator Automation**
- YouTubers promoting videos across platforms
- Bloggers sharing articles on social media
- Podcasters announcing new episodes

### 5. **Product Launches**
- Countdown campaigns (7-day lead-up to launch)
- Feature highlights (1 feature per day)
- Automated drip marketing

## Customization Options

### Adjust Post Frequency
Change from 7 posts to any number:
```typescript
// In BECOME (Generate Posts)
transform: 'postsGenerated = 14' // For bi-weekly

// In CEASE (Week Complete)
condition: 'postsPublished === 14'
```

### Multi-Platform Publishing
Modify the Daily Post node to publish to multiple platforms:
```typescript
// Parallel publishing
await Promise.all([
  publishToTwitter(post),
  publishToLinkedIn(post),
  publishToFacebook(post)
])
```

### Content Approval Workflow
Add a CEASE node between Schedule and Publish:
```typescript
{
  id: 'cease-approval-required',
  type: 'cease',
  data: {
    condition: 'approved === false',
    action: 'pause until approval',
    narrative: "⏸️ Waiting for content approval"
  }
}
```

### Dynamic Scheduling
Instead of fixed daily posts, schedule based on optimal times:
```typescript
// In BECOME (Schedule)
const optimalTimes = await getOptimalPostingTimes(audience)
schedulePostsAtOptimalTimes(posts, optimalTimes)
```

## Error Handling

### ChatGPT API Failures
Add error handling to the Generate Posts node:
```typescript
try {
  const posts = await generatePosts()
} catch (error) {
  campaign.status = 'generation-failed'
  await notifyUser('Post generation failed')
  // Option: Retry with exponential backoff
  // Option: Use fallback content library
}
```

### Publishing Failures
Add retry logic to Daily Post node:
```typescript
const maxRetries = 3
for (let i = 0; i < maxRetries; i++) {
  try {
    await publishPost()
    break
  } catch (error) {
    if (i === maxRetries - 1) {
      await notifyUser('Publishing failed after 3 attempts')
    }
    await sleep(Math.pow(2, i) * 1000) // Exponential backoff
  }
}
```

### API Rate Limits
Implement rate limit handling:
```typescript
if (error.status === 429) {
  const retryAfter = error.headers['retry-after']
  await sleep(retryAfter * 1000)
  await retry()
}
```

## Monitoring & Analytics

### Track Key Metrics
```typescript
metrics: {
  campaignsCompleted: number
  totalPostsPublished: number
  averageEngagement: number
  failureRate: number
  averageGenerationTime: number
  averagePublishingTime: number
}
```

### Logging
Add comprehensive logging at each stage:
```typescript
logger.info('Campaign initialized', { campaignId, timestamp })
logger.info('Posts generated', { count: 7, model: 'gpt-4' })
logger.info('Posts scheduled', { dates: [...] })
logger.info('Post published', { day: 1, platform: 'twitter' })
logger.info('Campaign completed', { totalPosts: 7, duration: '7 days' })
```

## Benefits of This Template

### For Users
✅ Saves hours of manual posting each week  
✅ Maintains consistent social media presence  
✅ Reduces mental overhead of "what to post today"  
✅ Professional content generation via AI  
✅ Automated scheduling ensures no missed posts  
✅ Clear completion notification  

### For Learning Fortistate
✅ Demonstrates complex workflow orchestration  
✅ Shows all 4 ontogenetic operators in action  
✅ Illustrates looping with self-referencing edges  
✅ Examples of external API integration points  
✅ Real-world automation use case  
✅ Universe transcending for continuous workflows  

### Technical Architecture
✅ State machine pattern (status field)  
✅ Counter-based progression tracking  
✅ Conditional branching (CEASE operator)  
✅ Loop implementation (self-referencing edge)  
✅ Clean separation of concerns  
✅ Extensible and customizable  

## Next Steps

### To Implement This Template

1. **Set up API Keys**
   - OpenAI API key for ChatGPT
   - Social media platform credentials
   - Calendar API credentials
   - Notification service credentials

2. **Create Integration Layer**
   ```typescript
   // src/integrations/social-media.ts
   export async function generatePosts() { }
   export async function scheduleToCalendar() { }
   export async function publishPost() { }
   export async function notifyUser() { }
   ```

3. **Configure Scheduler**
   - Set up cron jobs or cloud functions
   - Configure time zones
   - Set publishing times

4. **Test in Sandbox**
   - Run with test API credentials
   - Verify each step executes correctly
   - Test error scenarios

5. **Deploy to Production**
   - Monitor first few campaign cycles
   - Adjust timing/content as needed
   - Scale to multiple campaigns

## Related Templates

- **Email Drip Campaign**: Similar workflow for email sequences
- **Product Inventory Alerts**: Automated monitoring and notifications
- **User Onboarding Journey**: Multi-step user activation flows
- **Subscription Renewal Reminders**: Time-based customer engagement

## Support & Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Twitter API v2 Guide](https://developer.twitter.com/en/docs)
- [Google Calendar API](https://developers.google.com/calendar)
- [Fortistate Documentation](../docs/API.md)

---

**Template Version**: 1.0  
**Last Updated**: October 10, 2025  
**Maintained By**: Fortistate Core Team
