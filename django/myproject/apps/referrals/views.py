from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import ReferralDashboardSerializer
from .models import InvestmentTool

class ReferralDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tool_key = request.query_params.get('tool', None)
        context = {'request': request}
        
        if tool_key:
            # Проверяем, существует ли такой инструмент
            if not InvestmentTool.objects.filter(strategy_key=tool_key).exists():
                return Response({"error": f"Investment tool with key '{tool_key}' not found."}, status=404)
            context['tool_key'] = tool_key

        serializer = ReferralDashboardSerializer(request.user, context=context)
        return Response(serializer.data)
