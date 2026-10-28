/** An UPDATE is idempotent: if its response is lost, the RPC can safely repeat it. */
export function isNetworkError(error) {
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed/i.test(error?.message || '');
}
export async function updateGoal(client, id, values) {
  let result;
  try {
    result = await client.from('goals').update(values).eq('id', id).select('id').single();
  } catch (error) { result = {error}; }
  if (result.error && isNetworkError(result.error)) {
    // POST provides an alternative to PATCH without bypassing the caller's RLS.
    try {
      result = await client.rpc('update_diary_goal', {
        p_id: id,
        p_title: values.title,
        p_start_date: values.start_date,
        p_end_date: values.end_date,
        p_tracking: values.tracking,
        p_weekly_target: values.weekly_target,
      }).select('id').single();
    } catch (error) { result = {error}; }
  }
  if (result.error) throw result.error;
  if (result.data?.id !== id) throw new Error('No se pudo confirmar el objetivo guardado. Vuelve a entrar y comprueba que el objetivo sigue existiendo.');
  return result.data;
}
