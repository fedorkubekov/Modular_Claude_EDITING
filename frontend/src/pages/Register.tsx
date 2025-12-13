import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { api } from '@/services/api';
import type { RegisterRequest } from '@/types';

export const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyId: '',
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'admin' as 'admin' | 'manager' | 'employee',
  });
  const [isNewCompany, setIsNewCompany] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const registerData: RegisterRequest = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: formData.role,
      };

      if (isNewCompany) {
        if (!formData.companyName) {
          setError('Company name is required for new companies');
          setIsLoading(false);
          return;
        }
        registerData.company_name = formData.companyName;
      } else {
        const companyId = parseInt(formData.companyId);
        if (!companyId || companyId <= 0) {
          setError('Valid company ID is required');
          setIsLoading(false);
          return;
        }
        registerData.company_id = companyId;
      }

      await register(registerData);
      navigate('/dashboard');
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Modular ERP
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Company Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isNewCompany}
                    onChange={() => setIsNewCompany(true)}
                    className="mr-2"
                  />
                  <span className="text-sm">New Company</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isNewCompany}
                    onChange={() => setIsNewCompany(false)}
                    className="mr-2"
                  />
                  <span className="text-sm">Existing Company</span>
                </label>
              </div>
            </div>

            {/* Conditional Company Fields */}
            {isNewCompany ? (
              <Input
                label="Company Name"
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g., My Barbershop"
                required
              />
            ) : (
              <Input
                label="Company ID"
                type="number"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                placeholder="Enter company ID"
                required
              />
            )}

            {/* User Details */}
            <Input
              label="Full Name"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />

            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              required
              autoComplete="username"
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter a secure password"
              required
              autoComplete="new-password"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Create Account
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
