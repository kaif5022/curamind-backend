import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Basic Counts
    const totalPatients = await Patient.countDocuments({ createdBy: userId });
    const totalAppointments = await Appointment.countDocuments({ createdBy: userId });
    const completedAppointments = await Appointment.countDocuments({ createdBy: userId, status: 'Completed' });
    const pendingAppointments = await Appointment.countDocuments({ createdBy: userId, status: 'Scheduled' });

    // 2. Appointment Status Distribution
    const statusDistribution = await Appointment.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusData = statusDistribution.map(item => ({
      name: item._id,
      value: item.count
    }));

    const statuses = ['Scheduled', 'Completed', 'Cancelled'];
    statuses.forEach(status => {
      if (!statusData.find(s => s.name === status)) {
        statusData.push({ name: status, value: 0 });
      }
    });

    // 3. Monthly Appointments (Bar Chart)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of the month 6 months ago

    const monthlyAppointments = await Appointment.aggregate([
      { $match: { createdBy: userId, appointmentDate: { $gte: sixMonthsAgo } } },
      { 
        $group: { 
          _id: { month: { $month: '$appointmentDate' }, year: { $year: '$appointmentDate' } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Fill in missing months
    let monthlyData = [];
    for(let i=5; i>=0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
      
      const found = monthlyAppointments.find(item => item._id.month === d.getMonth() + 1 && item._id.year === d.getFullYear());
      monthlyData.push({
        name: mName,
        appointments: found ? found.count : 0
      });
    }

    // 4. Patient Growth (Line Chart - Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPatients = await Patient.aggregate([
      { $match: { createdBy: userId, createdAt: { $gte: thirtyDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { '_id': 1 } }
    ]);

    // Build complete 30 day array to ensure continuous line chart
    let patientGrowthData = [];
    for(let i=29; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const shortDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
      
      const found = recentPatients.find(item => item._id === dateStr);
      patientGrowthData.push({
        date: shortDate,
        patients: found ? found.count : 0
      });
    }

    res.json({
      summary: {
        totalPatients,
        totalAppointments,
        completedAppointments,
        pendingAppointments
      },
      charts: {
        statusData,
        monthlyData,
        patientGrowthData
      }
    });

  } catch (error) {
    next(error);
  }
};
