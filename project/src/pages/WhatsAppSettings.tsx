import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Settings,
  Activity,
  Phone,
  Shield,
  Copy,
  RefreshCw,
  Check,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  testMetaConnection,
  getWhatsAppStats,
  regenerateVerifyToken,
  toggleWhatsAppActive,
  getWebhookUrl,
  type WhatsAppConfig,
  type WhatsAppStats
} from '@/lib/whatsapp-admin';

// Placeholder business ID - in production, get from auth context
const BUSINESS_ID = 'demo-business-id';
const N8N_BASE_URL = import.meta.env.VITE_N8N_URL || 'https://your-n8n.app.n8n.cloud';

export default function WhatsAppSettings() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state for Meta Cloud API
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');

  // Form state for Twilio
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');

  // Provider selection
  const [provider, setProvider] = useState<'meta' | 'twilio'>('meta');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [configData, statsData] = await Promise.all([
        getWhatsAppConfig(BUSINESS_ID),
        getWhatsAppStats(BUSINESS_ID)
      ]);

      if (configData) {
        setConfig(configData);
        setPhoneNumberId(configData.phone_number_id || '');
        setAccessToken(configData.access_token || '');
        setWabaId(configData.waba_id || '');
        setDisplayPhone(configData.display_phone_number || '');
        setTwilioSid(configData.twilio_account_sid || '');
        setTwilioToken(configData.twilio_auth_token || '');
        setTwilioPhone(configData.twilio_phone_number || '');
        setProvider(configData.provider || 'meta');
      }

      setStats(statsData);
    } catch (error) {
      console.error('Failed to load WhatsApp settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setTestResult(null);

    try {
      const result = await saveWhatsAppConfig(BUSINESS_ID, {
        phone_number_id: phoneNumberId || null,
        access_token: accessToken || null,
        waba_id: wabaId || null,
        display_phone_number: displayPhone || null,
        twilio_account_sid: twilioSid || null,
        twilio_auth_token: twilioToken || null,
        twilio_phone_number: twilioPhone || null,
        provider,
        webhook_verify_token: config?.webhook_verify_token
      });

      if (result.success && result.config) {
        setConfig(result.config);
        setTestResult({ success: true, message: 'Configuration saved successfully!' });
      } else {
        setTestResult({ success: false, message: result.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!phoneNumberId || !accessToken) {
      setTestResult({ success: false, message: 'Please enter Phone Number ID and Access Token' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testMetaConnection(phoneNumberId, accessToken);
      if (result.success) {
        setTestResult({ success: true, message: `Connected! Phone: ${result.phoneNumber}` });
        if (result.phoneNumber) {
          setDisplayPhone(result.phoneNumber);
        }
      } else {
        setTestResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Network error during test' });
    } finally {
      setTesting(false);
    }
  }

  async function handleRegenerateToken() {
    const result = await regenerateVerifyToken(BUSINESS_ID);
    if (result.success && result.token) {
      setConfig(prev => prev ? { ...prev, webhook_verify_token: result.token! } : null);
    }
  }

  async function handleToggleActive() {
    if (!config) return;
    const newState = !config.is_active;
    const result = await toggleWhatsAppActive(BUSINESS_ID, newState);
    if (result.success) {
      setConfig(prev => prev ? { ...prev, is_active: newState } : null);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  }

  const webhookUrl = getWebhookUrl(N8N_BASE_URL);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Integration</h1>
          <p className="text-muted-foreground">
            Configure your WhatsApp Business API connection
          </p>
        </div>
        <Badge variant={config?.is_active ? 'default' : 'secondary'}>
          {config?.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">
                {stats.messagesReceived} received / {stats.messagesSent} sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueCustomers}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Conversations</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversationsToday}</div>
              <p className="text-xs text-muted-foreground">Active today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageResponseTime ? `${stats.averageResponseTime}ms` : '-'}
              </div>
              <p className="text-xs text-muted-foreground">Bot response time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta" onClick={() => setProvider('meta')}>
            Meta Cloud API
          </TabsTrigger>
          <TabsTrigger value="twilio" onClick={() => setProvider('twilio')}>
            Twilio (Fallback)
          </TabsTrigger>
          <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="meta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meta WhatsApp Cloud API</CardTitle>
              <CardDescription>
                Connect directly to Meta's WhatsApp Business API for lower costs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Meta Business Suite &gt; WhatsApp &gt; API Setup
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wabaId">WhatsApp Business Account ID</Label>
                  <Input
                    id="wabaId"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    placeholder="123456789012345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Generate a permanent token in Meta Business Suite
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayPhone">Display Phone Number</Label>
                <Input
                  id="displayPhone"
                  value={displayPhone}
                  onChange={(e) => setDisplayPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTestConnection} disabled={testing} variant="outline">
                  {testing ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Save Configuration
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="pt-4 border-t">
                <a
                  href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  Meta WhatsApp Cloud API Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="twilio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Twilio WhatsApp</CardTitle>
              <CardDescription>
                Use Twilio as a fallback provider for businesses that prefer it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twilioSid">Account SID</Label>
                  <Input
                    id="twilioSid"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twilioToken">Auth Token</Label>
                  <Input
                    id="twilioToken"
                    type="password"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilioPhone">WhatsApp Phone Number</Label>
                <Input
                  id="twilioPhone"
                  value={twilioPhone}
                  onChange={(e) => setTwilioPhone(e.target.value)}
                  placeholder="whatsapp:+14155238886"
                />
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Save Twilio Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration</CardTitle>
              <CardDescription>
                Configure these settings in your Meta Business Dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  >
                    {copied === 'webhook' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter this URL in Meta Business Suite &gt; WhatsApp &gt; Configuration
                </p>
              </div>

              <div className="space-y-2">
                <Label>Verify Token</Label>
                <div className="flex gap-2">
                  <Input
                    value={config?.webhook_verify_token || 'Not generated'}
                    readOnly
                    className="font-mono text-sm"
                    type="password"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(config?.webhook_verify_token || '', 'token')}
                  >
                    {copied === 'token' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleRegenerateToken}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this token to verify your webhook in Meta
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook Fields to Subscribe</Label>
                <div className="bg-muted p-3 rounded-md">
                  <ul className="text-sm space-y-1">
                    <li>- messages</li>
                    <li>- message_status (optional)</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Integration Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable WhatsApp integration
                  </p>
                </div>
                <Switch
                  checked={config?.is_active ?? false}
                  onCheckedChange={handleToggleActive}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>
                  <strong>Create a Meta Business Account</strong> at{' '}
                  <a
                    href="https://business.facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    business.facebook.com
                  </a>
                </li>
                <li>
                  <strong>Add WhatsApp Business</strong> to your Meta Business account
                </li>
                <li>
                  <strong>Get your Phone Number ID</strong> from API Setup in the WhatsApp section
                </li>
                <li>
                  <strong>Generate a Permanent Access Token</strong> with whatsapp_business_messaging permission
                </li>
                <li>
                  <strong>Configure the Webhook</strong> using the URL and verify token above
                </li>
                <li>
                  <strong>Subscribe to messages</strong> in the webhook configuration
                </li>
                <li>
                  <strong>Test by sending a message</strong> to your WhatsApp Business number
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
