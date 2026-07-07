using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Threading.Tasks;
using NovelryDTO.DTOs.User;

namespace NovelryMAUIApp.Repositories.User
{
    public class ApiUserRepository : IUserRepository
    {
        private readonly HttpClient _client;

        public ApiUserRepository(HttpClient client)
        {
            _client = client;
        }

        public async Task<UserDto?> AuthenticateAsync(string email, string password)
        {
            var response = await _client.PostAsJsonAsync(
                "/users/login",
                new { Email = email, Password = password }
            );
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<UserDto>();
        }

        public async Task<UserDto?> CreateUserAsync(CreateUserDto user)
        {
            var response = await _client.PostAsJsonAsync("/users", user);
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<UserDto>();
        }

        public async Task<bool> DeleteUserByIdAsync(int id)
        {
            var response = await _client.DeleteAsync($"/users/{id}");
            return response.IsSuccessStatusCode;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _client.GetFromJsonAsync<List<UserDto>>("/users");
            return users ?? new List<UserDto>();
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var users = await GetAllUsersAsync();
            return users.FirstOrDefault(u =>
                u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
            );
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var response = await _client.GetAsync($"/users/{id}");
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<UserDto>();
        }

        public async Task<UserDto?> GetUserByUsernameAsync(string username)
        {
            var users = await GetAllUsersAsync();
            return users.FirstOrDefault(u =>
                u.Username.Equals(username, StringComparison.OrdinalIgnoreCase)
            );
        }

        public async Task<UserDto?> UpdateUserAsync(UpdateUserDto user)
        {
            var response = await _client.PutAsJsonAsync($"/users/{user.Id}", user);
            if (!response.IsSuccessStatusCode)
                return null;
            return await response.Content.ReadFromJsonAsync<UserDto>();
        }
    }
}
