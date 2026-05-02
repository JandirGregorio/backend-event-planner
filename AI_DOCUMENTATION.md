**1. What did you ask the AI to help you with, and why did you choose to use AI for that specific task?**

While testing edge cases for the application, I noticed that if one event had, say a max capacity of 2, and all the spots were already filled, then a third user could still RSVP to the event. I had an idea of integrating another model to my RSVP model to check if the max capacity had been reached, so I asked AI to help by prompting:

> *I'm working on the backend for an event planner application using the MVC architecture. I have three tables: users, events, and RSVPs. The events table has a `max_capacity` (where max_capacity > 0). Right now, rsvp count can exceed the `max_capacity`. I want to add another model to verify if the max_capacity has been reached yet. Can you guide me so I can achieve this functionality or point me to the right documentation? Provide tradeoffs considered.*

This was a good opportunity to use AI to my advantage, as it could explain different approaches and their tradeoffs, giving me a varity of options to evaluate and choose the right one for my application at this stage.

**2. How did you evaluate whether the AI's output was correct or useful before using it?**

The AI provided different approaches to accomplish this logic, including the idea I had, to have a database-level contraint, and having a *pessimistic locking* using `SELECT ... FOR UPDATE`. It also explained the different tradeoffs I would have to make for each one and provided useful documentation to reference.

For the first approach, the idea I had in mind, the AI provided:

```sql
WITH capacity_check AS (
  SELECT
    e.max_capacity,
    COUNT(r.id) AS rsvp_count
  FROM events e
  LEFT JOIN rsvps r ON r.event_id = e.id
  WHERE e.id = $2
  GROUP BY e.max_capacity
)
INSERT INTO rsvps (user_id, event_id, created_at)
SELECT $1, $2, NOW()
FROM capacity_check
WHERE rsvp_count < max_capacity;
```

However, this approach was removing the `ON CONFLICT DO NOTHING` constraint implemented in my model to prevent user from sending too many RSVPs. I pushed back and asked the AI to suggest another approach and provided a new function `isEventAtCapacity` with a query:

```sql
SELECT COUNT(rsvps.rsvp_id) >= events.max_capacity AS at_capacity
    FROM events
    LEFT JOIN rsvps ON rsvps.event_id = events.event_id
    WHERE events.event_id = $1
    GROUP BY events.max_capacity
```

The `createRsvp` function would call it to act as a guard clause and throw an error if the max capacity had been reached.

```js
if (await isEventAtCapacity(event_id)) {
    throw new Error("Event has reached max capacity");
  }
```

I added this new code to my codebase, started the server, and tested to see if the capacity would exceed if I try to RSVP to an event at already at maximum capacity. This approach worked and decided to implement it.

I could have used the pessimistic locking approach. However, I decided to accept the small risk of RSVPs slightly exceeding `max_capacity` in a race condition, rather than locking every request and forcing them to queue sequentially.

**3. How did what the AI produced differ from what you ultimately used, and what does that tell you about your own understanding of the problem?**

When testing if the overflown rsvps were read, I noticed that I would see an error message in the frontend `Internal Server Error` and this made sense as the response the AI provided threw an error when the max capacity had been reached, however the frontend was not responding gracefully to this scenario and was treating it as an error rather than a guard clause.

I changed the if statement from throwing an error to retuning `null`. This aligned to what the frontend was expecting and provided a seamless interface when a user tried to RSVP to a full event.

In the end my code looked like this:

```js
const isEventAtCapacity = async (event_id) => {
  const query = `
    SELECT COUNT(rsvps.rsvp_id) >= events.max_capacity AS capacity_reached
    FROM events
    LEFT JOIN rsvps ON rsvps.event_id = events.event_id
    WHERE events.event_id = $1
    GROUP BY events.max_capacity
  `;
  const { rows } = await pool.query(query, [event_id]);
  return rows[0]?.capacity_reached ?? false;
};

module.exports.createRsvp = async (user_id, event_id) => {
  if (await isEventAtCapacity(event_id)) {
    return null;
  }
  // ... rest of code
}
```
This taught me to think how errors propagate across layers in unexpected ways if we don't critically analyze how the application contract is defined and how each layer responds to it.

**4. What did you learn from using AI in this way?**

This process of using AI reinforced the way I think about edge cases, tradeoffs, and scalability traits when it comes to using different approaches to solve the problem and what I'm willing to sacrifice with the one I choose to implement.

I decided to use application-level check solution, as the application is at early stage. As the application scales, the next step would be implementing the atomic `UPDATE` approach, which improves correctness over the current solution without the performance cost or the pessimistic locking approach.
