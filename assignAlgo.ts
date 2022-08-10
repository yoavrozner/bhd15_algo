class EventDuration extends Number { }

class CalendarEvent {
    startDate: Date;
    endDate: Date;
    constructor(obj: {
        startDate?: Date,
        startTime?: number,
        endDate?: Date,
        duration?: EventDuration
        endTime?: number,
    }) {
        const { startDate, startTime, endDate, duration, endTime } = obj;
        // this.id = 'id' + (new Date()).getTime();
        if (startDate) this.startDate = startDate;
        else if (startTime) this.startDate = new Date(startTime);

        if (endDate) this.endDate = endDate;
        else if (duration) this.endDate = new Date(duration.valueOf() - this.startDate.getTime());
        else if (endTime) this.endDate = new Date(endTime);
    }

    public get range(): [number, number] {
        return [this.startTime, this.endTime];
    }

    public get startTime(): number {
        return this.startDate.getTime();
    }

    public get endTime(): number {
        return this.endDate.getTime();
    }

    public get duration(): EventDuration {
        return this.endTime - this.startTime;
    }
}


// Calendar class for place / rooms / offices / classes
class Calendar {
    events: CalendarEvent[];
    startDate: Date;
    endDate: Date;
    constructor(startDate: Date, endDate: Date) {
        this.events = [];
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public get startTime(): number {
        return this.startDate.getTime();
    }

    public get endTime(): number {
        return this.endDate.getTime();
    }

    isOverlapping(event1: CalendarEvent, event2: CalendarEvent) {
        return !(((event1.startTime <= event2.endTime) && (event1.endTime <= event2.startTime)) ||
            ((event2.startTime <= event1.endTime) && (event2.endTime <= event1.startTime)));
    }

    canAddEvent(event: CalendarEvent) {
        const startEdgeOverflow = this.startTime >= event.startTime;
        const endEdgeOverflow = this.endDate ? this.endTime <= event.endTime : false;
        const eventsOverlapp = this.events.some((calendarEvent: CalendarEvent) => this.isOverlapping(event, calendarEvent));
        return !startEdgeOverflow && !endEdgeOverflow && !eventsOverlapp;
    }

    addEvent(event: CalendarEvent) {
        this.events.push(event);
    }

    removeEvent() {
        this.events.pop();
    }
}

// A group (array) of assigned Calendars binded together
type Schedule = Calendar[] | null;

class ScoredSchedule {
    schedule: NonNullable<Schedule>;
    score: number;
    constructor(schedule: Schedule) {
        if (!schedule) throw new Error('Empty schedule');
        this.schedule = schedule;
        this.score = this.scoringAlgo(schedule);
    }

    scoringAlgo(schedule: NonNullable<Schedule>) {
        const EVENTS_SCORING_WEIGHT = 10;
        const FREE_TIME_SCORING_WEIGHT = 1;

        const eventsInCalendars: number[] = [];
        const freeTimeInCalendars: number[] = [];

        schedule.forEach((calendar) => {
            eventsInCalendars.push(calendar.events.length);
            const freeTime = calendar.endTime - calendar.startTime -
                calendar.events.reduce((duration, currentEvent) => duration + currentEvent.duration.valueOf(), 0)
            freeTimeInCalendars.push(freeTime);
        });

        const diffArr = (arr: number[]) => Math.max(...arr) - Math.min(...arr);

        const diffEvents = diffArr(eventsInCalendars);
        const diffFreeTime = diffArr(freeTimeInCalendars);

        const scoreEvents = diffEvents * EVENTS_SCORING_WEIGHT;
        const scoreFreeTime = diffFreeTime.toString().length * FREE_TIME_SCORING_WEIGHT;
        return scoreEvents + scoreFreeTime;
    }
}

const assign = (
    calendars: Calendar[],
    staticEvents: CalendarEvent[],
    dynamicEvents: EventDuration[]): Schedule => {
    const backtrackDivergence = (
        calendar: Calendar,
        event: CalendarEvent,
        cb: () => Schedule): Schedule => {
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
    const dynamicBacktrackDivergence = (
        calendar: Calendar,
        duration: EventDuration,
        cb: () => Schedule,
        event?: CalendarEvent): Schedule => {
        const startTime = event ? event.startTime + 1 : calendar.startTime + 1;
        const dynamicEvent = new CalendarEvent({ startTime, duration });
        return backtrackDivergence(calendar, dynamicEvent, cb);
    };
    const staticBacktrack = (
        calendars: Calendar[],
        staticEvents: CalendarEvent[]): Schedule => {
        if (staticEvents.length === 0) {
            return calendars;
        }

        const staticEventsClone = staticEvents.concat();
        // Non-Null Assertion Operator !
        const staticEvent = staticEventsClone.shift()!;
        const backtrackCallback = staticBacktrack.bind(null, calendars, staticEventsClone);

        for (let calendarIndex = 0; calendarIndex < calendars.length; calendarIndex++) {
            const calendar = calendars[calendarIndex];
            const result = backtrackDivergence(calendar, staticEvent, backtrackCallback);
            if (result) {
                return result;
            }
        }
        return null;
    }
    const dynamicBacktrack = (
        calendars: Calendar[],
        dynamicEvents: EventDuration[]): Schedule => {
        if (dynamicEvents.length === 0) {
            return calendars;
        }

        const dynamicEventsClone = dynamicEvents.concat();
        // Non-Null Assertion Operator !
        const duration = dynamicEventsClone.shift()!;
        const backtrackCallback = dynamicBacktrack.bind(null, calendars, dynamicEventsClone);

        for (let calendarIndex = 0; calendarIndex < calendars.length; calendarIndex++) {
            const calendar = calendars[calendarIndex];
            const result = dynamicBacktrackDivergence(calendar, duration, backtrackCallback);
            if (result) {
                return result;
            }

            for (let eventIndex = 0; eventIndex < calendar.events.length; eventIndex++) {
                const calendarEvent = calendar.events[eventIndex];
                const result = dynamicBacktrackDivergence(calendar, duration, backtrackCallback, calendarEvent);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    }

    let schedule = staticBacktrack(calendars, staticEvents);
    if (schedule)
        schedule = dynamicBacktrack(schedule, dynamicEvents);
    return schedule;
}

const initCalendar = (numberOfCalendars: number) => {
    const allItems: Calendar[] = [];

    for (let i = 0; i < numberOfCalendars; i++) {
        allItems.push(new Calendar(new Date(0), new Date(100)));
    }

    return allItems;
};

const initClasses = () => {
    return initCalendar(10);
};

const initBadrooms = () => {
    return initCalendar(5);
}


const initOffices = () => {
    return initCalendar(7);
}

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
}

const initDynamicCoursesRanges = () => {
    const dynamicCourses: EventDuration[] = [];

    for (let i = 0; i < 17; i += 2) {
        const duration = new EventDuration(10 + i);
        dynamicCourses.push(duration);
        dynamicCourses.push(duration);
        dynamicCourses.push(duration);
        dynamicCourses.push(duration);
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
