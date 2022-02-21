/**
* *Computes the DateTime
* @returns {String} Datetime
*/
exports.getDateTime = () => {
    const timestamp = new Date()
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }
    return timestamp.toLocaleDateString('fr-fr', options)
}