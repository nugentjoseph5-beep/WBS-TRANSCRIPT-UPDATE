import { test, expect } from '@playwright/test';
import { waitForAppReady, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Microsoft 365 Authentication UI', () => {
  
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test.describe('Login Page', () => {
    
    test('displays login page with correct elements', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check page title/heading
      await expect(page.getByRole('heading', { name: 'Welcome back', exact: true })).toBeVisible();
      await expect(page.getByText('Sign in to access your transcript requests')).toBeVisible();
    });

    test('shows Student and Staff/Admin login type toggle', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check login type toggle buttons
      const studentTab = page.getByRole('button', { name: 'Student', exact: true });
      const staffTab = page.getByRole('button', { name: 'Staff / Admin', exact: true });
      
      await expect(studentTab).toBeVisible();
      await expect(staffTab).toBeVisible();
    });

    test('Student tab shows Microsoft 365 sign-in button', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Student tab should be selected by default
      const ms365Button = page.getByRole('button', { name: /Sign in with Microsoft 365/i });
      await expect(ms365Button).toBeVisible();
      
      // Should show info about wolmers.org email requirement
      await expect(page.getByText(/Students:/)).toBeVisible();
      await expect(page.getByText('firstname.lastname.graduationyear@wolmers.org')).toBeVisible();
    });

    test('Student tab shows "Request Wolmer\'s Email" link', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for email request link
      await expect(page.getByText(/Don't have a Wolmer's email address/i)).toBeVisible();
      const requestEmailLink = page.getByRole('link', { name: /Request a Wolmer's Email Address/i });
      await expect(requestEmailLink).toBeVisible();
      
      // Verify it links to Google Form
      await expect(requestEmailLink).toHaveAttribute('href', /forms\.gle/);
      await expect(requestEmailLink).toHaveAttribute('target', '_blank');
    });

    test('Staff/Admin tab shows email and password form', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Click Staff/Admin tab
      const staffTab = page.getByRole('button', { name: 'Staff / Admin', exact: true });
      await staffTab.click();
      
      // Should show email/password form with data-testids
      await expect(page.getByTestId('login-form')).toBeVisible();
      await expect(page.getByTestId('login-email-input')).toBeVisible();
      await expect(page.getByTestId('login-password-input')).toBeVisible();
      await expect(page.getByTestId('login-submit-btn')).toBeVisible();
      
      // Should show forgot password link
      await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
    });

    test('Staff/Admin login form validates required fields', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Click Staff/Admin tab
      const staffTab = page.getByRole('button', { name: 'Staff / Admin', exact: true });
      await staffTab.click();
      
      // Try to submit empty form - HTML5 validation should prevent submission
      const submitBtn = page.getByTestId('login-submit-btn');
      const emailInput = page.getByTestId('login-email-input');
      
      // Check email input has required attribute
      await expect(emailInput).toHaveAttribute('required', '');
    });

    test('Staff/Admin login with valid credentials navigates to admin dashboard', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Click Staff/Admin tab
      const staffTab = page.getByRole('button', { name: 'Staff / Admin', exact: true });
      await staffTab.click();
      
      // Fill in admin credentials
      await page.getByTestId('login-email-input').fill('admin@wolmers.org');
      await page.getByTestId('login-password-input').fill('Admin123!');
      
      // Submit
      await page.getByTestId('login-submit-btn').click();
      
      // Wait for navigation to admin dashboard
      await page.waitForURL(/\/(admin|staff|student)/, { timeout: 10000 });
      
      // Should have navigated away from login page
      await expect(page).not.toHaveURL(/\/login/);
    });

    test('Microsoft 365 button shows Windows logo icon', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for Microsoft logo SVG in the button
      const ms365Button = page.getByRole('button', { name: /Sign in with Microsoft 365/i });
      const svgIcon = ms365Button.locator('svg');
      await expect(svgIcon).toBeVisible();
    });

    test('toggle between Student and Staff tabs preserves correct UI', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      const studentTab = page.getByRole('button', { name: 'Student', exact: true });
      const staffTab = page.getByRole('button', { name: 'Staff / Admin', exact: true });
      
      // Initially on Student tab - should see MS365 button, no form
      await expect(page.getByRole('button', { name: /Sign in with Microsoft 365/i })).toBeVisible();
      await expect(page.getByTestId('login-form')).not.toBeVisible();
      
      // Switch to Staff tab - should see form, no MS365 button
      await staffTab.click();
      await expect(page.getByTestId('login-form')).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign in with Microsoft 365/i })).not.toBeVisible();
      
      // Switch back to Student tab
      await studentTab.click();
      await expect(page.getByRole('button', { name: /Sign in with Microsoft 365/i })).toBeVisible();
      await expect(page.getByTestId('login-form')).not.toBeVisible();
    });
  });

  test.describe('Register Page', () => {
    
    test('displays register page with correct elements', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check page title/heading
      await expect(page.getByRole('heading', { name: 'Create your account', exact: true })).toBeVisible();
      await expect(page.getByText(/Sign up using your Wolmer's Microsoft 365 account/i)).toBeVisible();
    });

    test('shows Microsoft 365 sign-in button', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      const ms365Button = page.getByRole('button', { name: /Continue with Microsoft 365/i });
      await expect(ms365Button).toBeVisible();
    });

    test('displays student registration requirements', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for requirements info box
      await expect(page.getByText(/Student Registration Requirements/i)).toBeVisible();
      await expect(page.getByText(/@wolmers\.org email address/i)).toBeVisible();
      await expect(page.getByText(/Sign in with your Microsoft 365 credentials/i)).toBeVisible();
      await expect(page.getByText(/Your account will be created automatically/i)).toBeVisible();
    });

    test('shows email format example', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for email format example
      await expect(page.getByText(/firstname\.lastname\.graduationyear@wolmers\.org/i)).toBeVisible();
    });

    test('shows "Request Wolmer\'s Email" link', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      await expect(page.getByText(/Don't have a Wolmer's email address yet/i)).toBeVisible();
      const requestEmailLink = page.getByRole('link', { name: /Request a Wolmer's Email Address/i });
      await expect(requestEmailLink).toBeVisible();
      await expect(requestEmailLink).toHaveAttribute('target', '_blank');
    });

    test('shows link to login page', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      await expect(page.getByText(/Already have an account/i)).toBeVisible();
      const loginLink = page.getByRole('link', { name: 'Sign in' });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('navigates to login page when clicking "Sign in" link', async ({ page }) => {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      const loginLink = page.getByRole('link', { name: 'Sign in' });
      await loginLink.click();
      
      await page.waitForURL(/\/login/);
      await expect(page).toHaveURL(/\/login/);
    });

    test('displays left panel features list', async ({ page }) => {
      // Set viewport to ensure left panel is visible
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Check for features list in left panel
      await expect(page.getByText('Official Academic Transcripts')).toBeVisible();
      await expect(page.getByText('Recommendation Letters')).toBeVisible();
      await expect(page.getByText('Real-time Status Updates')).toBeVisible();
      await expect(page.getByText('Multiple Delivery Options')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    
    test('home page links to login page', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Look for login link
      const loginLink = page.getByRole('link', { name: /Sign In|Login/i }).first();
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await page.waitForURL(/\/login/);
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test('home page links to register page', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Look for register/sign up link
      const registerLink = page.getByRole('link', { name: /Request|Register|Sign Up|Get Started/i }).first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await page.waitForURL(/\/register/);
        await expect(page).toHaveURL(/\/register/);
      }
    });

    test('logo links back to home page from login', async ({ page }) => {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      
      // Click the school logo/name which should link to home
      const homeLink = page.getByRole('link').filter({ has: page.getByText(/Wolmer's Boys' School/i) }).first();
      await homeLink.click();
      
      await expect(page).toHaveURL('/');
    });
  });
});
