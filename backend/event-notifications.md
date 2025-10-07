# Event Notifications System

## Overview

The event notification system automatically sends notifications to users when events are scheduled for the current day or when events are starting soon.

## Features

### 1. Daily Event Notifications
- **Schedule**: Runs every day at 7:00 AM
- **Purpose**: Notifies users about events scheduled for the current day
- **Recipients**: Event creators and all event participants
- **Message**: Includes event title, time, and location

### 2. Event Starting Soon Notifications
- **Schedule**: Runs every 30 minutes
- **Purpose**: Notifies users about events starting within the next hour
- **Recipients**: Event creators and all event participants
- **Message**: Includes event title, time until start, and location

## Implementation Details

### Files Modified/Created

1. **`backend/reminderScheduler.js`**
   - Added `sendEventDayNotifications()` function
   - Added `sendEventStartingSoonNotifications()` function
   - Updated cron schedules to include event notifications

2. **`backend/controllers/eventController.js`**
   - Added `triggerEventNotifications()` function for manual testing

3. **`backend/routes/eventRoutes.js`**
   - Added POST `/api/events/trigger-notifications` endpoint

4. **`backend/scripts/testEventNotifications.js`**
   - Test script for manual testing of notification functions

### Database Models Used

- **Event**: Contains event details (title, startDate, endDate, location, etc.)
- **EventParticipant**: Links events to users (participants)
- **User**: User information for notifications
- **Notification**: Stores notification records

### Notification Types

- **Type**: `"event"`
- **Title**: `"Event Today"` or `"Event Starting Soon"`
- **Metadata**: Includes eventId, eventTitle, eventStartDate, eventLocation, and minutesUntilStart (for starting soon notifications)

## API Endpoints

### Manual Trigger (Testing Only)

**POST** `/api/events/trigger-notifications`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "type": "day" | "starting_soon"
}
```

**Response:**
```json
{
  "message": "Event day notifications triggered successfully"
}
```

**Access**: HR role only

## Testing

### 1. Manual Testing via API

```bash
# Test daily event notifications
curl -X POST http://localhost:3000/api/events/trigger-notifications \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "day"}'

# Test starting soon notifications
curl -X POST http://localhost:3000/api/events/trigger-notifications \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "starting_soon"}'
```

### 2. Script Testing

```bash
# Run the test script
node backend/scripts/testEventNotifications.js
```

## Cron Schedules

- **Daily at 7:00 AM**: `"0 7 * * *"` - Sends daily event notifications
- **Every 30 minutes**: `"*/30 * * * *"` - Checks for events starting soon

## Notification Messages

### Daily Notifications
- **Creator**: `"Your event "{title}" is scheduled for today at {time}. Location: {location}"`
- **Participant**: `"You have an event "{title}" today at {time}. Location: {location}"`

### Starting Soon Notifications
- **Creator**: `"Your event "{title}" starts in {minutes} minutes at {time}. Location: {location}"`
- **Participant**: `"Your event "{title}" starts in {minutes} minutes at {time}. Location: {location}"`

## Error Handling

- All notification functions include try-catch blocks
- Errors are logged to console
- Failed notifications don't stop the scheduler from running
- Database connection issues are handled gracefully

## Future Enhancements

1. **Email Notifications**: Add email support for event notifications
2. **Push Notifications**: Implement push notifications for mobile apps
3. **Customizable Timing**: Allow users to set their preferred notification timing
4. **Event Reminders**: Add configurable reminder intervals (1 day, 1 hour, 15 minutes before)
5. **Notification Preferences**: Allow users to opt-out of certain notification types
