from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from characters.models import SaveSlot

CACHE_TTL = 300  # 5 minutes


def _require_premium(user):
    sub = getattr(user, 'subscription', None)
    return sub and sub.is_premium


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_characters(request):
    """Top 100 characters by level, then kills."""
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)

    cache_key = 'leaderboard_characters'
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    result = []
    for slot in SaveSlot.objects.select_related('user').iterator():
        guild = slot.guild_state or {}
        for char in guild.get('characters', []):
            result.append({
                'username': slot.user.username,
                'guild_name': guild.get('name', ''),
                'character_name': char.get('name', ''),
                'race': char.get('race', ''),
                'class': char.get('class', ''),
                'level': char.get('level', 1),
                'kills': char.get('kills', 0),
                'deaths': char.get('deaths', 0),
                'status': char.get('status', 'Healthy'),
            })

    result.sort(key=lambda c: (-c['level'], -c['kills']))
    top = result[:100]
    cache.set(cache_key, top, CACHE_TTL)
    return Response(top)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_guilds(request):
    """Top 50 guilds by total XP of all characters (sum of experience values)."""
    if not _require_premium(request.user):
        return Response({'error': 'Premium required'}, status=403)

    cache_key = 'leaderboard_guilds'
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    guilds = {}
    for slot in SaveSlot.objects.filter(slot=0).select_related('user').iterator():
        guild = slot.guild_state or {}
        name = guild.get('name', 'Unknown Guild')
        total_xp = sum(c.get('experience', 0) for c in guild.get('characters', []))
        total_level = sum(c.get('level', 1) for c in guild.get('characters', []))
        member_count = len(guild.get('characters', []))
        key = f'{slot.user.username}:{name}'
        if key not in guilds or guilds[key]['total_xp'] < total_xp:
            guilds[key] = {
                'username': slot.user.username,
                'guild_name': name,
                'member_count': member_count,
                'total_xp': total_xp,
                'total_level': total_level,
            }

    result = sorted(guilds.values(), key=lambda g: -g['total_xp'])[:50]
    cache.set(cache_key, result, CACHE_TTL)
    return Response(result)
