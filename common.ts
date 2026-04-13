export class Common {
  static clearToken(): void {
    localStorage.removeItem("TradToken");
    localStorage.removeItem("AllSymbol");
  }

  static firstRun() {
    if (!localStorage.getItem("FirstRun")) {
      localStorage.setItem(
        "FirstRun",
        this.getDateFormat(new Date().toString())
      );
      console.log("create first run flag");
    }
  }

  static isDateInPast(dateString: string): boolean {
    // Parse the date string (dd-mm-yyyy)
    const [day, month, year] = dateString.split("-").map(Number);

    // Create a date object from parsed values
    const inputDate = new Date(year, month - 1, day); // month is zero-indexed in JavaScript Date

    // Get today's date (only the date, without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Compare dates
    return inputDate < today;
  }

  static getDateFormat(date) {
    var d = new Date(date),
      month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
  }

  // Example usage:
  // const year = 2025;
  // const month = 1; // September (0-based index, so 8 means September)
  // const lastFriday = getLastFridayOfMonth(year, month);
  // console.log(lastFriday); // Outputs the date of the last Friday of September 2024
  static isLastFridayOfMonth(): boolean {
    // Get the last day of the month  new Date('2024-09-27T01:15:16')
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();

    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the last day (0 = Sunday, 6 = Saturday)
    const lastDayOfWeek = lastDay.getDay();

    // Calculate the difference to the last Friday (5 = Friday)
    const diffToFriday = (lastDayOfWeek + 2) % 7;

    // Subtract the difference from the last day
    lastDay.setDate(lastDay.getDate() - diffToFriday);

    var monthOfLastFridayDate = this.dateToString(lastDay);
    var todaysDate = this.dateToString(date);

    return monthOfLastFridayDate == todaysDate ? true : false;
  }

  static isLastMondayOfMonth(): boolean {
    // Get the last day of the month  new Date('2024-09-27T01:15:16')
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();

    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the last day (0 = Sunday, 6 = Saturday)
    const lastDayOfWeek = lastDay.getDay();

    // Calculate the difference to the last Friday (5 = Friday)
    const diffToFriday = (lastDayOfWeek + 6) % 7;

    // Subtract the difference from the last day
    lastDay.setDate(lastDay.getDate() - diffToFriday);

    var monthOfLastFridayDate = this.dateToString(lastDay);
    var todaysDate = this.dateToString(date);

    return monthOfLastFridayDate == todaysDate ? true : false;
  }

  static dateToString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    const day = date.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}
