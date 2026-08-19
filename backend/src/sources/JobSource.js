/**
 * Base abstract class representing a job source.
 * Any new source adapter must extend this class and implement its methods.
 */
class JobSource {
  /**
   * Returns the unique name of this source (e.g., 'remotive').
   * @returns {string}
   */
  getSourceName() {
    throw new Error("getSourceName() must be implemented");
  }

  /**
   * Fetches job listings from the external source and returns them as normalized ExternalJob objects.
   * @returns {Promise<Array<Object>>} List of normalized external jobs
   */
  async fetchJobs() {
    throw new Error("fetchJobs() must be implemented");
  }
}

module.exports = JobSource;
