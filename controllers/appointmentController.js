import Appointment from '../models/Appointment.js';

export const createAppointment = async (req, res, next) => {
  try {
    const { patientName, doctorName, appointmentDate, appointmentTime, reason, status, notes } = req.body;
    
    const appointment = new Appointment({
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      reason,
      status: status || 'Scheduled',
      notes,
      createdBy: req.user._id,
    });

    const createdAppointment = await appointment.save();
    res.status(201).json(createdAppointment);
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ createdBy: req.user._id }).sort({ appointmentDate: 1, appointmentTime: 1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (appointment && appointment.createdBy.toString() === req.user._id.toString()) {
      res.json(appointment);
    } else {
      res.status(404);
      throw new Error('Appointment not found');
    }
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment && appointment.createdBy.toString() === req.user._id.toString()) {
      appointment.patientName = req.body.patientName || appointment.patientName;
      appointment.doctorName = req.body.doctorName || appointment.doctorName;
      appointment.appointmentDate = req.body.appointmentDate || appointment.appointmentDate;
      appointment.appointmentTime = req.body.appointmentTime || appointment.appointmentTime;
      appointment.reason = req.body.reason !== undefined ? req.body.reason : appointment.reason;
      appointment.status = req.body.status || appointment.status;
      appointment.notes = req.body.notes !== undefined ? req.body.notes : appointment.notes;

      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404);
      throw new Error('Appointment not found');
    }
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment && appointment.createdBy.toString() === req.user._id.toString()) {
      await appointment.deleteOne();
      res.json({ message: 'Appointment removed' });
    } else {
      res.status(404);
      throw new Error('Appointment not found');
    }
  } catch (error) {
    next(error);
  }
};
