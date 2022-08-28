# bhd15_algo
Assigns static and dynamic events to multiple calendars using backtracking algorithm.

The events are courses.

The calendars represent the calendar of facility / building / bedroom / class and every other type of resource that can be assign through time.

The algorithm is a simple backtracking algorithm that tries every available event assignment and stops if it finds a way to schedule all the events in the calendars.
The algorithm splits into 2 steps:
1. Assign static events
2. Assign dynamic events

Static event is an event which have a static start and end date and must occur in his specific date.

Dynamic event is a duration of time which the event should last and can be assigned in every free space in the calendar as long as it has enough space for it's duration.

Due to the fact that the static events have more constrains and is harder to fullfil we firstly run the algorithm on the static events and then run it again on the dynamic events so they can be filled in free spaces between static events.

![Backtracking algorithm example](https://www.interviewbit.com/blog/wp-content/uploads/2021/12/Algorithm.gif)
