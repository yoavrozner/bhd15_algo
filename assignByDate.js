let assignDates = [];

for (let i = 17; i >= 1; i -= 2) {
    const date = [new Date(i).getTime(), new Date(i + 1).getTime()];
    assignDates.push(date);
    assignDates.push(date);
    assignDates.push(date);
    assignDates.push(date);
    assignDates.push(date);
    assignDates.push(date);
    assignDates.push(date);
}

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

const assign = (calendars, assignDates) => {
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
    const calendar = backtrack(calendars, assignDates)
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


(async () => {
    const allClasses = initClasses();

    console.log(JSON.stringify(assign(allClasses, assignDates), null, 2));
})();
