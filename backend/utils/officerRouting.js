const supabase = require('../config/supabase');

async function autoAssignOfficer(city, department) {
  let officerId = null;
  let routingNote = '';

  if (city && department) {
    const { data } = await supabase
      .from('users')
      .select('id, workload_count')
      .eq('role', 'officer')
      .eq('verified', true)
      .eq('city', city)
      .eq('department', department)
      .order('workload_count', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1);

    if (data?.length) {
      officerId = data[0].id;
      routingNote = `Auto-assigned: matched city "${city}" + department "${department}"`;
    }
  }

  if (!officerId && city) {
    const { data } = await supabase
      .from('users')
      .select('id, workload_count')
      .eq('role', 'officer')
      .eq('verified', true)
      .eq('city', city)
      .order('workload_count', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1);

    if (data?.length) {
      officerId = data[0].id;
      routingNote = `Fallback: no ${department || 'matching'} officer in "${city}", assigned to least busy city officer`;
    }
  }

  if (!officerId) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (data?.length) {
      officerId = data[0].id;
      routingNote = `Fallback: no officer found for city "${city || '—'}", escalated to district admin`;
    }
  }

  if (officerId) {
    await supabase.rpc('increment_workload', { user_id: officerId });
  }

  return { officerId, routingNote };
}

module.exports = { autoAssignOfficer };