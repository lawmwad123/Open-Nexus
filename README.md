# Nexus App

Welcome to the Nexus app! This application is built using [Expo](https://expo.dev) and integrates with Supabase for backend services to implement a robust Challenges feature.
## Watch the Video Demo

![Video Demo Thumbnail](https://img.youtube.com/vi/BPLBOkH5JDA/0.jpg)
[Watch the Project Demo on YouTube](https://youtu.be/BPLBOkH5JDA)

## Challenges Overview

A challenge is a time-limited competition where multiple participants can compete with content like videos, images, or audio. Users can:
- Create a new challenge.
- Join an existing challenge as a participant.
- Vote, like, or comment on submissions in a challenge.

## Challenges Screen UI

### Active Challenges:
- Display challenges currently open for participation or voting.
- Each challenge is shown as a card or rectangle, featuring:
  - Challenge title.
  - Thumbnail of the most voted or trending participant.
  - Countdown timer showing remaining time.

### Completed Challenges:
- Display challenges that have ended.
- Show the winner prominently along with total votes received.

### Challenge Details Screen:
- Show all submissions for a specific challenge.
- Display submissions as a grid or carousel for easy navigation.
- Users can vote, like, or comment on each submission.

## Challenge Creation

### New Challenge Workflow:
- Allow users to create a challenge by:
  - Entering a title and description.
  - Setting the challenge duration (e.g., 24 hours).
  - Optionally uploading a cover image for the challenge.
  - Choosing the type of submissions allowed: video, image, or audio.
- Store challenge metadata in Supabase:
  - Challenge ID, title, description, creator ID, start time, end time, and allowed submission type.

### Joining an Existing Challenge:
- Users can join by submitting content that matches the allowed type.
- Store submissions in Supabase with metadata:
  - Submission ID, user ID, challenge ID, content URL, and timestamp.

## Challenge Participation and Voting

### Submissions:
- Participants can upload their submissions directly within the app.
- Support video recording, photo capture, or audio recording using the device's camera and microphone.
- Store media temporarily in Supabase storage.

### Voting:
- Display all submissions on the Challenge Details screen.
- Users can vote for one submission per challenge.
- Track votes in Supabase:
  - Store user ID, challenge ID, and submission ID to prevent multiple votes.

### Likes and Comments:
- Allow users to like and comment on submissions.
- Comments flow dynamically alongside submissions for a real-time feel.

## Challenge Completion and Results

Once the challenge duration ends:
- Identify the submission with the highest votes as the winner.
- Mark the challenge as completed in Supabase.
- Notify participants and voters of the result via push notifications.

### Winner Announcement Screen:
- Display the winning submission with its vote count.
- Show a leaderboard of top participants.

## Backend Architecture

### Supabase Tables:
- Challenges: Stores challenge metadata.
- Submissions: Stores participants' content.
- Votes: Tracks user votes for submissions.
- Comments: Stores comments for submissions.

### Logic:
- Use Supabase triggers or cron jobs to check for challenge expiry and update the status automatically.
- Implement real-time updates for new votes, likes, and comments.

## Notifications and Engagement

Send notifications for:
- New challenges created.
- Invitations to join challenges.
- New votes, likes, or comments on submissions.
- Challenge results and winners.

## UI/UX Design Notes

- Use vibrant colors and animations to make challenges visually engaging.
- Include dynamic countdown timers for active challenges.
- Provide clear CTAs (e.g., "Join Challenge," "Vote Now").
- Add swipe gestures to navigate between submissions.

## Development Tools

### Frontend:
- Use Expo Camera for media capture.
- Use Lottie or Reanimated for animations.
- Use React Navigation for challenge screens and transitions.

### Backend:
- Supabase for authentication, database, and media storage.
- Real-time updates for voting, comments, and notifications.

## Deliverables
- Challenges Screen: List active and completed challenges with filters.
- Challenge Details Screen: Show all submissions, voting options, and comments.
- Challenge Creation: Allow users to create and join challenges.
- Voting and Interaction: Enable real-time voting, likes, and comments.
- Results and Leaderboard: Display winners and rankings after challenge completion.
- Notifications: Real-time engagement for all challenge activities.
