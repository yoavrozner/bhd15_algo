

// console.log(assignDates)

// class Event {
//     constructor(startDate, endDate) {
//         this.id = 'id' + (new Date()).getTime();
//         this.startDate = startDate;
//         this.endDate = endDate;
//     }
// }


// Calendar class for place / rooms / offices / classes
class Calendar {
    constructor(startDate = 0, endDate = undefined) {
        this.events = [];
        this.startDate = startDate;
        this.endDate = endDate;
    }

    isOverlapping(range1, range2) {
        return !(((range1[0] <= range2[1]) && (range1[1] <= range2[0])) ||
            ((range2[0] <= range1[1]) && (range2[1] <= range1[0])));
    }

    // canAddEvent(startDate, endDate) {
    //     return canAddEvent([startDate, endDate]);
    // }

    canAddEvent(rangeToAdd) {
        const startEdgeOverflow = this.startDate >= rangeToAdd[0];
        const endEdgeOverflow = this.endDate ? this.endDate <= rangeToAdd[1] : false;
        const eventsOverlapp = this.events.some((range) => this.isOverlapping(range, rangeToAdd));
        return !startEdgeOverflow && !endEdgeOverflow && !eventsOverlapp;
    }

    addEvent(event) {
        this.events.push(event);
    }

    removeEvent() {
        this.events.pop();
    }
}

const assign = (calendars, assignDates, dynamicRanges) => {
    const backtrack = (calendars, assignDates) => {
        if (assignDates.length === 0) {
            return calendars;
        }

        for (let assignIndex = 0; assignIndex < assignDates.length; assignIndex++) {
            const rangeToAssign = assignDates[assignIndex];
            let isAssigned = false;

            for (let calendarIndex = 0; calendarIndex < calendars.length; calendarIndex++) {
                const calendar = calendars[calendarIndex];

                if (calendar.canAddEvent(rangeToAssign)) {
                    isAssigned = true;
                    calendar.addEvent(rangeToAssign);
                    const tempArr = assignDates.concat();
                    tempArr.splice(assignIndex, 1);
                    const result = backtrack(calendars, tempArr);
                    if (result) {
                        return result;
                    }
                    calendar.removeEvent();
                    isAssigned = false;
                }
            }
            if (!isAssigned) return null;
        }
    }
    const dynamicBacktrack = (calendars, dynamicRanges) => {
        if (dynamicRanges.length === 0) {
            return calendars;
        }

        for (let dynamicIndex = 0; dynamicIndex < dynamicRanges.length; dynamicIndex++) {
            let isAssigned = false;

            for (let calendarIndex = 0; calendarIndex < calendars.length; calendarIndex++) {
                const calendar = calendars[calendarIndex];

                const currRange = dynamicRanges[dynamicIndex];
                let startRangeDate = calendar.startDate + 1;
                let rangeToAssign = [startRangeDate, startRangeDate + currRange];
                if (calendar.canAddEvent(rangeToAssign)) {
                    isAssigned = true;
                    calendar.addEvent(rangeToAssign);
                    const tempArr = dynamicRanges.concat();
                    tempArr.splice(dynamicIndex, 1);
                    const result = dynamicBacktrack(calendars, tempArr);
                    if (result) {
                        return result;
                    }
                    calendar.removeEvent();
                    isAssigned = false;
                }

                for (let eventIndex = 0; eventIndex < calendar.events.length; eventIndex++) {
                    const event = calendar.events[eventIndex];
                    const eventEnd = event[1];
                    startRangeDate = eventEnd + 1;
                    rangeToAssign = [startRangeDate, startRangeDate + currRange];

                    if (calendar.canAddEvent(rangeToAssign)) {
                        isAssigned = true;
                        calendar.addEvent(rangeToAssign);
                        const tempArr = dynamicRanges.concat();
                        tempArr.splice(dynamicIndex, 1);
                        const result = dynamicBacktrack(calendars, tempArr);
                        if (result) {
                            return result;
                        }
                        calendar.removeEvent();
                        isAssigned = false;
                    }
                }
            }
            if (!isAssigned) return null;
        }
    }

    let calendar = backtrack(calendars, assignDates);
    calendar = dynamicBacktrack(calendars, dynamicRanges);
    return calendar;
}

const initCalendar = (numberOfCalendars) => {
    const allItems = [];

    for (let i = 0; i < numberOfCalendars; i++) {
        allItems.push(new Calendar(0, 100));
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
    let assignDates = [];

    for (let i = 1; i < 17; i += 2) {
        const date = [new Date(i).getTime(), new Date(i + 1).getTime()];
        assignDates.push(date);
        assignDates.push(date);
        assignDates.push(date);
        assignDates.push(date);
        assignDates.push(date);
        assignDates.push(date);
        assignDates.push(date);
    }

    return assignDates;
}

const initDynamicCoursesRanges = () => {
    let assignRange = [];

    for (let i = 0; i < 17; i += 2) {
        const range = 10 + i;
        assignRange.push(range);
        assignRange.push(range);
        assignRange.push(range);
        assignRange.push(range);
        assignRange.push(range);
        // assignRange.push(range);
    }

    return assignRange;
}

(async () => {
    const staticCourses = initStaticCoursesDates();
    const dynamicCourses = initDynamicCoursesRanges();
    const allClasses = initClasses();

    // console.log(JSON.stringify(assign(allClasses, staticCourses), null, 2));
    assign(allClasses, staticCourses, dynamicCourses);
    console.log(JSON.stringify(allClasses));
})();
