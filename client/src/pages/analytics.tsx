import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useRef, useState } from "react";

interface AnalyticsData {
  totalCustomers: number;
  avgWaitTime: number;
  offerClicks: number;
  revenue: number;
  customerFlow: number[];
  servicePopularity: { name: string; count: number }[];
  peakHours: number[];
}

export default function Analytics() {
  const { salonId } = useParams<{ salonId: string }>();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("This Week");
  
  // Chart refs
  const customerFlowChartRef = useRef<HTMLCanvasElement>(null);
  const servicesChartRef = useRef<HTMLCanvasElement>(null);
  const peakHoursChartRef = useRef<HTMLCanvasElement>(null);
  
  // Store chart instances to destroy them when component unmounts
  const chartsRef = useRef<any[]>([]);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/salons", salonId, "analytics"],
    retry: false,
    enabled: !!user && !!salonId,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  useEffect(() => {
    // Load Chart.js dynamically
    const loadChartJS = async () => {
      if (typeof window !== 'undefined' && analytics) {
        try {
          // Load Chart.js from CDN
          if (!(window as any).Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => initializeCharts();
            document.head.appendChild(script);
          } else {
            initializeCharts();
          }
        } catch (error) {
          console.error('Failed to load Chart.js:', error);
        }
      }
    };

    loadChartJS();

    // Cleanup charts on unmount
    return () => {
      chartsRef.current.forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
      chartsRef.current = [];
    };
  }, [analytics]);

  const initializeCharts = () => {
    if (!analytics || !(window as any).Chart) return;

    const Chart = (window as any).Chart;

    // Destroy existing charts
    chartsRef.current.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    chartsRef.current = [];

    // Customer Flow Chart
    if (customerFlowChartRef.current) {
      const customerFlowChart = new Chart(customerFlowChartRef.current, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Customers',
            data: analytics.customerFlow,
            borderColor: '#f8bbd9',
            backgroundColor: 'rgba(248, 187, 217, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      chartsRef.current.push(customerFlowChart);
    }

    // Services Chart
    if (servicesChartRef.current) {
      const servicesChart = new Chart(servicesChartRef.current, {
        type: 'doughnut',
        data: {
          labels: analytics.servicePopularity.map(s => s.name),
          datasets: [{
            data: analytics.servicePopularity.map(s => s.count),
            backgroundColor: ['#f8bbd9', '#e879a6', '#d946ef', '#a21caf', '#86198f']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            }
          }
        }
      });
      chartsRef.current.push(servicesChart);
    }

    // Peak Hours Chart
    if (peakHoursChartRef.current) {
      const peakHoursChart = new Chart(peakHoursChartRef.current, {
        type: 'bar',
        data: {
          labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
          datasets: [{
            label: 'Customers',
            data: analytics.peakHours,
            backgroundColor: '#f8bbd9',
            borderColor: '#e879a6',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      chartsRef.current.push(peakHoursChart);
    }
  };

  const formatRevenue = (cents: number) => {
    if (cents >= 100000) {
      return `$${(cents / 100000).toFixed(1)}k`;
    }
    return `$${(cents / 100).toFixed(0)}`;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blush-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <i className="fas fa-chart-bar text-gray-300 text-6xl mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Analytics Data</h1>
            <p className="text-gray-600 mb-4">Analytics data is not available for this salon.</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50 pb-20">
      {/* Navigation */}
      <nav className="bg-white border-b border-blush-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              className="text-gray-600 hover:text-blush-500 transition-colors"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <i className="fas fa-arrow-left text-lg"></i>
            </button>
            <h1 className="font-serif text-lg font-semibold text-gray-800">Analytics</h1>
            <button className="text-gray-600 hover:text-blush-500 transition-colors">
              <i className="fas fa-download text-lg"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Time Period Selector */}
      <section className="px-4 py-6">
        <div className="flex space-x-2 mb-6">
          {['This Week', 'This Month', 'This Year'].map((period) => (
            <Button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-blush-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid={`button-period-${period.toLowerCase().replace(' ', '-')}`}
            >
              {period}
            </Button>
          ))}
        </div>
      </section>

      {/* Key Metrics */}
      <section className="px-4 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-users text-blue-500 text-xl"></i>
                <span className="text-xs text-green-600 font-medium">+15%</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-total-customers">
                {analytics.totalCustomers}
              </div>
              <p className="text-sm text-gray-600">Total Customers</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-clock text-yellow-500 text-xl"></i>
                <span className="text-xs text-red-600 font-medium">+2min</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-avg-wait-time">
                {analytics.avgWaitTime}
              </div>
              <p className="text-sm text-gray-600">Avg Wait Time (min)</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-percentage text-purple-500 text-xl"></i>
                <span className="text-xs text-green-600 font-medium">+8%</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-offer-clicks">
                {analytics.offerClicks}
              </div>
              <p className="text-sm text-gray-600">Offer Clicks</p>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
                <span className="text-xs text-green-600 font-medium">+12%</span>
              </div>
              <div className="text-2xl font-bold text-gray-800" data-testid="text-revenue">
                {formatRevenue(analytics.revenue)}
              </div>
              <p className="text-sm text-gray-600">Revenue</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Customer Flow Chart */}
      <section className="px-4 pb-6">
        <Card className="border-gray-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Customer Flow This Week</h3>
            <div className="h-64">
              <canvas ref={customerFlowChartRef} className="w-full h-full"></canvas>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Service Popularity */}
      <section className="px-4 pb-6">
        <Card className="border-gray-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Popular Services</h3>
            <div className="h-64">
              <canvas ref={servicesChartRef} className="w-full h-full"></canvas>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Peak Hours */}
      <section className="px-4 pb-6">
        <Card className="border-gray-100 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Peak Hours</h3>
            <div className="h-64">
              <canvas ref={peakHoursChartRef} className="w-full h-full"></canvas>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Performance Summary */}
      <section className="px-4 pb-20">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Summary</h3>
        
        <div className="space-y-4">
          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">Customer Satisfaction</span>
                <span className="text-green-600 font-bold">4.8/5.0</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '96%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">Queue Efficiency</span>
                <span className="text-blue-600 font-bold">87%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">No-Show Rate</span>
                <span className="text-red-600 font-bold">5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">Repeat Customers</span>
                <span className="text-purple-600 font-bold">73%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '73%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
