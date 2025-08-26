import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blush-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <i className="fas fa-cut text-blush-500 text-4xl"></i>
              <h1 className="font-serif text-5xl font-bold text-gray-800">SmartQ</h1>
            </div>
            
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Skip the Wait, Book Your Spot
            </h2>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join virtual queues at your favorite salons and get notified when it's your turn. 
              The modern way to manage your beauty appointments.
            </p>
            
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                onClick={handleLogin}
                className="bg-gradient-to-r from-blush-500 to-pink-500 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] w-full sm:w-auto"
                data-testid="button-login"
              >
                Get Started
              </Button>
              
              <Button 
                variant="outline"
                className="border-2 border-blush-300 text-blush-600 font-semibold py-4 px-8 rounded-2xl hover:bg-blush-50 transition-all w-full sm:w-auto"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="font-serif text-3xl font-bold text-gray-800 mb-4">
              Why Choose SmartQ?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of salon booking with our innovative queue management system
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-blush-200 hover:shadow-lg transition-shadow" data-testid="card-feature-queue">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-clock text-blush-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-xl text-gray-800 mb-2">Virtual Queue</h4>
                <p className="text-gray-600">
                  Join salon queues remotely and track your position in real-time
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 border-blush-200 hover:shadow-lg transition-shadow" data-testid="card-feature-notifications">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-bell text-blush-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-xl text-gray-800 mb-2">Smart Notifications</h4>
                <p className="text-gray-600">
                  Get notified when it's your turn - no more waiting around
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 border-blush-200 hover:shadow-lg transition-shadow" data-testid="card-feature-rewards">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blush-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-star text-blush-600 text-2xl"></i>
                </div>
                <h4 className="font-semibold text-xl text-gray-800 mb-2">Loyalty Rewards</h4>
                <p className="text-gray-600">
                  Earn points with every visit and unlock exclusive benefits
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="font-serif text-3xl font-bold text-gray-800 mb-4">
            Ready to Transform Your Salon Experience?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of customers who have already upgraded their beauty routine
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-gradient-to-r from-blush-500 to-pink-500 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            data-testid="button-get-started"
          >
            Get Started Today
          </Button>
        </div>
      </div>
    </div>
  );
}
