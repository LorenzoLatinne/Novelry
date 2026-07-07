using NovelryDTO.DTOs.Timer;

namespace NovelryMAUIApp.Repositories.Interfaces
{
    public interface ITimerRepository
    {
        // Create
        Task<TimerDto?> CreateTimerAsync(CreateTimerDto timer);

        // Read
        Task<List<TimerDto>> GetAllTimersAsync();
        Task<List<TimerDto>> GetAllTimersByBookAsync(string bookTitle);
        Task<List<TimerDto>> GetAllTimersByUsernameAsync(string username);
        Task<List<TimerDto>> GetAllTimersByUserIdAsync(int userId);

        Task<List<TimerDto>> GetAllTimersByUserIdAndBookIdAsync(int userId, int bookId);
        Task<TimerDto?> GetTimerByIdAsync(int id);

        // Update
        Task<TimerDto?> UpdateTimerAsync(UpdateTimerDto timer);

        // Delete
        Task<bool> DeleteTimerByIdAsync(int id);
    }
}
