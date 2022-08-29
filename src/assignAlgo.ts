// A class that describes the duration of non static events.
class EventDuration extends Number {}

// A class for describing an event that will occur in a Calendar
class CalendarEvent {
    // The start of the event. Stored as Date.
    startDate: Date;
    // The end of the event. Stored as Date.
    endDate: Date;
    // Contains the constraints of the current calendar.
    constraints: { [key: string]: number };

    /**
     * The constructor for CalendarEvent.
     * @param obj contains the different inputs that the constructor can
     * accept for CalendarEvent creation.
     */
    constructor(obj: {
        startDate?: Date;
        startTime?: number;
        endDate?: Date;
        duration?: EventDuration;
        endTime?: number;
        constraints?: { [key: string]: number };
    }) {
        const {
            startDate,
            startTime,
            endDate,
            duration,
            endTime,
            constraints,
        } = obj;
        // this.id = 'id' + (new Date()).getTime();
        if (startDate) this.startDate = startDate;
        else if (startTime) this.startDate = new Date(startTime);
        else throw new Error('Start date is required');

        if (endDate) this.endDate = endDate;
        else if (duration)
            this.endDate = new Date(
                duration.valueOf() - this.startDate.getTime()
            );
        else if (endTime) this.endDate = new Date(endTime);
        else throw new Error('End date is required');

        this.constraints = constraints ?? {};
    }

    /**
     * @return the event as range of start and end date in
     * a form of [start date, end date].
     */
    public get range(): [number, number] {
        return [this.startTime, this.endTime];
    }

    /**
     * @return the start date in milliseconds.
     */
    public get startTime(): number {
        return this.startDate.getTime();
    }

    /**
     * @return the end date in milliseconds.
     */
    public get endTime(): number {
        return this.endDate.getTime();
    }

    /**
     * @return the duration of the event in milliseconds.
     */
    public get duration(): EventDuration {
        return this.endTime - this.startTime;
    }
}

// Calendar class for place / rooms / offices / classes.
class Calendar {
    // Contains all the events in the current calendar.
    events: CalendarEvent[];
    // Contains when the calendar events should start.
    startDate: Date;
    // Contains when the calendar events must end.
    endDate: Date;
    // Contains the resources of the current calendar.
    resources: { [key: string]: number };
    /**
     * The constructor for Calendar.
     * @param startDate describes when the calendar starts.
     * @param endDate describes when the calendar ends.
     */
    constructor(
        startDate: Date,
        endDate: Date,
        resources: { [key: string]: number } = {}
    ) {
        this.events = [];
        this.startDate = startDate;
        this.endDate = endDate;
        this.resources = resources;
    }

    /**
     * @return the start date of the calendar in milliseconds.
     */
    public get startTime(): number {
        return this.startDate.getTime();
    }

    /**
     * @return the end date of the calendar in milliseconds.
     */
    public get endTime(): number {
        return this.endDate.getTime();
    }

    /**
     * Checks if two events are overlapping each other.
     * @param event1 an event which have start and end date.
     * @param event2 an event which have start and end date.
     * @returns true if the events are overlapping and false if they are
     * foreign to each other.
     */
    isOverlapping(event1: CalendarEvent, event2: CalendarEvent): Boolean {
        return !(
            (event1.startTime <= event2.endTime &&
                event1.endTime <= event2.startTime) ||
            (event2.startTime <= event1.endTime &&
                event2.endTime <= event1.startTime)
        );
    }

    canAddEvent(event: CalendarEvent): Boolean {
        return (
            this.canAddEventInTime(event) && this.canAddEventInResources(event)
        );
    }

    /**
     * Checks if a given event can be added to the calendar events without
     * overlapping other events.
     * @param event a calendar event.
     * @returns true if it can be added to calendar in time. Otherwise, false.
     */
    private canAddEventInTime(event: CalendarEvent): Boolean {
        const startEdgeOverflow = this.startTime >= event.startTime;
        const endEdgeOverflow = this.endDate
            ? this.endTime <= event.endTime
            : false;
        const eventsOverlap = this.events.some((calendarEvent: CalendarEvent) =>
            this.isOverlapping(event, calendarEvent)
        );
        return !startEdgeOverflow && !endEdgeOverflow && !eventsOverlap;
    }

    /**
     * Checks if a the calendar has enough resources to contain the given event.
     * @param event a calendar event.
     * @returns true the calendar has enough resources to contain the event.
     */
    private canAddEventInResources(event: CalendarEvent): Boolean {
        const eventConstraintsEntries: [string, number][] = Object.entries(
            event.constraints
        );
        const resourcesClone: { [key: string]: number } = { ...this.resources };
        for (
            let constraintIndex = 0;
            constraintIndex < eventConstraintsEntries.length;
            constraintIndex++
        ) {
            const [constraintName, constraintValue] =
                eventConstraintsEntries[constraintIndex];
            if (
                !(
                    resourcesClone[constraintName] &&
                    resourcesClone[constraintName] - constraintValue
                )
            )
                return false;
        }
        return true;
    }

    /**
     * Adds an event to the calendar events.
     * @param event a calendar event.
     */
    addEvent(event: CalendarEvent) {
        this.events.push(event);

        const eventConstraintsEntries: [string, number][] = Object.entries(
            event.constraints
        );
        const resourcesClone: { [key: string]: number } = { ...this.resources };
        for (
            let constraintIndex = 0;
            constraintIndex < eventConstraintsEntries.length;
            constraintIndex++
        ) {
            const [constraintName, constraintValue] =
                eventConstraintsEntries[constraintIndex];
            resourcesClone[constraintName] -= constraintValue;
        }
        this.resources = resourcesClone;
    }

    /**
     * Removes the last event that was added to the calendar events.
     */
    removeEvent() {
        this.events.pop();
    }
}

// A group (array) of assigned Calendars binned together.
type Schedule = Calendar[] | null;

// A schedule with score of how well it is organized.
class ScoredSchedule {
    // The schedule that was scored.
    schedule: NonNullable<Schedule>;
    // The score of the current schedule.
    score: number;

    /**
     * The constructor of ScoredSchedule.
     * @param schedule the schedule to score.
     */
    constructor(schedule: Schedule) {
        if (!schedule) throw new Error('Empty schedule');
        this.schedule = schedule;
        this.score = this.scoringAlgo(schedule);
    }

    /**
     * The scoring algorithm of schedule scoring.
     * The algorithm uses weights to score some parameters in the schedule.
     * @param schedule a schedule that will be scored.
     * @returns the score of the schedule.
     */
    scoringAlgo(schedule: NonNullable<Schedule>): number {
        const EVENTS_SCORING_WEIGHT = 10;
        const FREE_TIME_SCORING_WEIGHT = 1;

        const eventsInCalendars: number[] = [];
        const freeTimeInCalendars: number[] = [];

        schedule.forEach((calendar) => {
            eventsInCalendars.push(calendar.events.length);
            const freeTime =
                calendar.endTime -
                calendar.startTime -
                calendar.events.reduce(
                    (duration, currentEvent) =>
                        duration + currentEvent.duration.valueOf(),
                    0
                );
            freeTimeInCalendars.push(freeTime);
        });

        const diffArr = (arr: number[]) => Math.max(...arr) - Math.min(...arr);

        const diffEvents = diffArr(eventsInCalendars);
        const diffFreeTime = diffArr(freeTimeInCalendars);

        const scoreEvents = diffEvents * EVENTS_SCORING_WEIGHT;
        const scoreFreeTime =
            diffFreeTime.toString().length * FREE_TIME_SCORING_WEIGHT;
        return scoreEvents + scoreFreeTime;
    }
}

/**
 * Assigns static and dynamic events to multiple calendars using backtracking algorithm.
 * @param calendars the calendars that will contain the events.
 * @param staticEvents the static events that must last in specif dates.
 * @param dynamicEvents the dynamic events that can last whenever there is a free space
 * (space the size it's duration) in the schedule.
 * @returns assigned schedule with the events organized in it's calendars or null if it
 * can assign all the events.
 */
const assign = (
    calendars: Calendar[],
    staticEvents: CalendarEvent[],
    dynamicEvents: EventDuration[]
): Schedule => {
    const durationFromMaxToMin = (
        duration1: EventDuration,
        duration2: EventDuration
    ) => duration2.valueOf() - duration1.valueOf();
    const durationOfEventFromMaxToMin = (
        event1: CalendarEvent,
        event2: CalendarEvent
    ) => durationFromMaxToMin(event1.duration, event2.duration);
    const sortStaticEventsByDuration = (
        staticEvents: CalendarEvent[]
    ): CalendarEvent[] =>
        staticEvents.concat().sort(durationOfEventFromMaxToMin);
    const sortDynamicEventsByDuration = (dynamicEvents: EventDuration[]) =>
        dynamicEvents.concat().sort(durationFromMaxToMin);
    /**
     * Single static event backtrack divergence (or branch) that checks if a calendar
     * can add the event and create a divergence in the schedule assignment.
     * @param calendar the calendar that is being assigned.
     * @param event the event to assign the calendar.
     * @param cb the next function to call in the current backtrack divergence.
     * @returns schedule if the current divergence has succeeded. Otherwise, null.
     */
    const staticBacktrackDivergence = (
        calendar: Calendar,
        event: CalendarEvent,
        cb: () => Schedule
    ): Schedule => {
        if (calendar.canAddEvent(event)) {
            calendar.addEvent(event);
            const result = cb();
            if (result) {
                return result;
            }
            calendar.removeEvent();
        }
        return null;
    };

    /**
     * Calls the static backtrack divergence function after converting dynamic event to static event.
     * @param calendar the calendar that is being assigned.
     * @param duration the dynamic event duration.
     * @param cb the next function to call in the current backtrack divergence.
     * @param event static event that the dynamic event will be constructed after it.
     * @returns schedule if the current divergence has succeeded. Otherwise, null.
     */
    const dynamicBacktrackDivergence = (
        calendar: Calendar,
        duration: EventDuration,
        cb: () => Schedule,
        event?: CalendarEvent
    ): Schedule => {
        // Construct the new event right after the static event end time or right from the start of the calendar.
        const startTime = event ? event.endTime + 1 : calendar.startTime + 1;
        const dynamicEvent = new CalendarEvent({ startTime, duration });
        return staticBacktrackDivergence(calendar, dynamicEvent, cb);
    };
    /**
     * Recursive (backtracking) algorithm to assign static events in calendars.
     * The algorithm tries all the available options of event assignment in the calendars.
     * The stops when it finds a solution which all of the events are assigned into the calendars successfully.
     * @param calendars the available calendars that will contain the events.
     * @param staticEvents the static events to assign.
     * @returns a schedule containing all the calendars with the events assigned in them.
     * In case there is no solution, the function returns null.
     */
    const staticBacktrack = (
        calendars: Calendar[],
        staticEvents: CalendarEvent[]
    ): Schedule => {
        // Check if there are any available events. If there are not any,
        // return the calendars as the assigned schedule.
        if (staticEvents.length === 0) {
            return calendars;
        }

        // Clone the static events to safely alter the array and send it to the next functions.
        const staticEventsClone = staticEvents.concat();
        // Non-Null Assertion Operator ! because we are sure that staticEvents contains at least one event.
        const staticEvent = staticEventsClone.shift()!;
        // Because all the backtrack divergences of this backtrack divergence use the same callback,
        // we can create it once and use it on each divergence without recreating it.
        const backtrackCallback = staticBacktrack.bind(
            null,
            calendars,
            staticEventsClone
        );

        // Search every calendar and create a divergence if the event can be assigned there.
        for (
            let calendarIndex = 0;
            calendarIndex < calendars.length;
            calendarIndex++
        ) {
            const calendar = calendars[calendarIndex];
            const result = staticBacktrackDivergence(
                calendar,
                staticEvent,
                backtrackCallback
            );
            // If the result was successful, return it backwards.
            if (result) {
                return result;
            }
        }
        // Return null if the event could not be assigned to the calendars in the current divergence.
        return null;
    };
    /**
     * Recursive (backtracking) algorithm to assign dynamic events in calendars.
     * The algorithm tries all the available options of event assignment in the calendars.
     * It tries ot construct the dynamic event in the start of the calendar and after already assigned events.
     * In this method, the assignment function needs much less iteration because it covers exactly all the
     * assignment possibilities (not more and not less).
     * The stops when it finds a solution which all of the events are assigned into the calendars successfully.
     * @param calendars the available calendars that will contain the events.
     * @param dynamicEvents the dynamic events to assign (dynamic event is just a duration of the event).
     * @returns a schedule containing all the calendars with the events assigned in them.
     * In case there is no solution, the function returns null.
     */
    const dynamicBacktrack = (
        calendars: Calendar[],
        dynamicEvents: EventDuration[]
    ): Schedule => {
        // Check if there are any available events. If there are not any,
        // return the calendars as the assigned schedule.
        if (dynamicEvents.length === 0) {
            return calendars;
        }
        // Clone the static events to safely alter the array and send it to the next functions.
        const dynamicEventsClone = dynamicEvents.concat();
        // Non-Null Assertion Operator ! because we are sure that staticEvents contains at least one event.
        const duration = dynamicEventsClone.shift()!;
        // Because all the backtrack divergences of this backtrack divergence use the same callback,
        // we can create it once and use it on each divergence without recreating it.
        const backtrackCallback = dynamicBacktrack.bind(
            null,
            calendars,
            dynamicEventsClone
        );

        // Search every calendar and create a divergence if the event can be assigned there.
        for (
            let calendarIndex = 0;
            calendarIndex < calendars.length;
            calendarIndex++
        ) {
            const calendar = calendars[calendarIndex];
            // Check if the event can be assigned at start of the calendar.
            const result = dynamicBacktrackDivergence(
                calendar,
                duration,
                backtrackCallback
            );
            // If the result was successful, return it backwards.
            if (result) {
                return result;
            }

            // Iterate on every event that has already assigned until this divergence.
            for (
                let eventIndex = 0;
                eventIndex < calendar.events.length;
                eventIndex++
            ) {
                const calendarEvent = calendar.events[eventIndex];
                // Check if the event can be assigned after the current event and create a divergence.
                const result = dynamicBacktrackDivergence(
                    calendar,
                    duration,
                    backtrackCallback,
                    calendarEvent
                );
                // If the result was successful, return it backwards.
                if (result) {
                    return result;
                }
            }
        }
        // Return null if the event could not be assigned to the calendars in the current divergence.
        return null;
    };

    const sortedStaticEvents = sortStaticEventsByDuration(staticEvents);
    const sortedDynamicEvents = sortDynamicEventsByDuration(dynamicEvents);
    // Firstly try to assign all the static events and then assign the dynamic events because the static events
    // are harder to fullfil because it is has more constraints (specific date and not just duration).
    let schedule = staticBacktrack(calendars, sortedStaticEvents);
    if (schedule) schedule = dynamicBacktrack(schedule, sortedDynamicEvents);
    return schedule;
};

// Generate fake calendars for test reasons.
const initCalendar = (numberOfCalendars: number) => {
    const allItems: Calendar[] = [];

    for (let i = 0; i < numberOfCalendars; i++) {
        allItems.push(new Calendar(new Date(0), new Date(100)));
    }

    return allItems;
};

// Generate fake calendars of classes for test reasons.
const initClasses = () => initCalendar(10);

// Generate fake calendars of offices for test reasons.
const initOffices = () => initCalendar(7);

// Generate fake static events for test reasons.
const initStaticCoursesDates = () => {
    const staticCourses: CalendarEvent[] = [];

    for (let i = 1; i < 17; i += 2) {
        const date: CalendarEvent = new CalendarEvent({
            startTime: i,
            endTime: i + 1,
        });
        staticCourses.push(date);
        staticCourses.push(date);
        staticCourses.push(date);
        staticCourses.push(date);
        staticCourses.push(date);
        staticCourses.push(date);
        staticCourses.push(date);
    }

    return staticCourses;
};

// Generate fake dynamic events for test reasons.
const initDynamicCoursesRanges = () => {
    const dynamicCourses: EventDuration[] = [];

    for (let i = 0; i < 10; i += 2) {
        const duration = new EventDuration(10 + i);
        dynamicCourses.push(duration);
        // dynamicCourses.push(duration);
        // dynamicCourses.push(duration);
        // dynamicCourses.push(duration);
    }

    return dynamicCourses;
};

(async () => {
    const staticCourses = initStaticCoursesDates();
    const dynamicCourses = initDynamicCoursesRanges();
    const allClasses = initClasses();

    assign(allClasses, staticCourses, dynamicCourses);
    console.log(JSON.stringify(allClasses));
})();
