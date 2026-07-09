const db = require('./db');
const { schedulePowerOn, schedulePowerOff } = require('./scheduler');

const rescheduleTasks = async () => {
  try {
    const schedules = await db.getSchedules();
    if (schedules && schedules.length > 0) {
      schedules.forEach(schedule => {
        if (schedule.power_on_time) {
          console.log(`Reagendando power on para ${schedule.server_ip} às ${schedule.power_on_time}`);
          schedulePowerOn(schedule.server_ip, schedule.username, schedule.password, schedule.power_on_time, schedule.days_of_week);
        }
        if (schedule.power_off_time) {
          console.log(`Reagendando power off para ${schedule.server_ip} às ${schedule.power_off_time}`);
          schedulePowerOff(schedule.server_ip, schedule.username, schedule.password, schedule.power_off_time, schedule.days_of_week);
        }
      });
    }
  } catch (error) {
    console.error("Erro ao reagendar tarefas:", error);
  }
};

module.exports = {
  rescheduleTasks
};
